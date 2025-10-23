import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderDirection, OrderStatus } from './entities/order.entity';
import { Position } from './entities/position.entity';
import { WalletService } from '../wallet/wallet.service';
import { AssetsService } from '../assets/assets.service';
import { PriceFeedService } from '../price-feed/price-feed.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class TradingService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    private readonly walletService: WalletService,
    private readonly assetsService: AssetsService,
    private readonly priceFeedService: PriceFeedService,
    private dataSource: DataSource,
  ) { }
  /**
   * Tạo lệnh mới
   */
  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate asset
      const asset = await this.assetsService.findOne(createOrderDto.assetId);
      if (!asset.isAvailable) {
        throw new BadRequestException('Asset is not available for trading');
      }

      // Validate amount
      if (
        createOrderDto.investAmount < asset.minTradeAmount ||
        createOrderDto.investAmount > asset.maxTradeAmount
      ) {
        throw new BadRequestException(
          `Investment amount must be between $${asset.minTradeAmount} and $${asset.maxTradeAmount}`,
        );
      }

      // Lock balance
      await this.walletService.lockBalance(userId, createOrderDto.investAmount);

      const symbol = asset.apiSymbol || asset.symbol;

      // 🔹 Lấy giá feed mới nhất (đang delay 2 phút)
      const latestFeed = await this.priceFeedService.getLatestPrice(symbol);
      if (!latestFeed) {
        throw new BadRequestException('Cannot get latest feed price');
      }

      // 🔹 Xác định block kế tiếp (mở ở phút tiếp theo so với block feed hiện có)
      const nextMinuteTimestamp = Number(latestFeed.minuteTimestamp) + 60 * 1000;

      // 🔹 Lấy giá của block kế tiếp
      const nextBlock = await this.priceFeedService.getPriceByTimestamp(
        symbol,
        nextMinuteTimestamp,
      );

      if (!nextBlock) {
        throw new BadRequestException(
          `No price data for next block ${new Date(nextMinuteTimestamp).toISOString()}`,
        );
      }

      // 🔹 Giá mở của block kế tiếp chính là openPrice
      const openPrice = nextBlock.open;

      // Thời gian mở/đóng lệnh
      const openTime = nextMinuteTimestamp;
      const closeTime = openTime + createOrderDto.duration * 1000;

      // 🔹 Tạo order
      const order = queryRunner.manager.create(Order, {
        userId,
        assetId: createOrderDto.assetId,
        direction: createOrderDto.direction,
        investAmount: createOrderDto.investAmount,
        openPrice,
        openTime,
        closeTime,
        duration: createOrderDto.duration,
        status: OrderStatus.ACTIVE,
        profitPercentage: asset.profitPercentage,
      });

      const savedOrder = await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
 * Đóng lệnh và tính toán kết quả
 */
  async closeOrder(orderId: string): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: ['asset'],
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      if (order.status !== OrderStatus.ACTIVE) {
        throw new BadRequestException(`Order ${orderId} is not active`);
      }

      const symbol = order.asset.apiSymbol || order.asset.symbol;

      // 🧩 Log để theo dõi
      console.log(`[CLOSE_ORDER] Start closing order`, {
        id: order.id,
        symbol,
        openPrice: order.openPrice,
        closeTime: order.closeTime,
        closeTimeISO: new Date(Number(order.closeTime)).toISOString(),
      });

      // Kiểm tra closeTime hợp lệ
      if (!order.closeTime || isNaN(Number(order.closeTime))) {
        throw new BadRequestException(
          `Invalid closeTime for order ${order.id}: ${order.closeTime}`,
        );
      }

      // 🔹 Lấy block tại closeTime (hoặc gần nhất trong logic DB)
      const closeBlock = await this.priceFeedService.getPriceByTimestamp(
        symbol,
        order.closeTime,
      );

      // Log chi tiết để debug
      console.log(`[CLOSE_ORDER] closeBlock`, closeBlock);

      if (!closeBlock) {
        throw new BadRequestException(
          `No price block found for ${symbol} at closeTime ${order.closeTime}`,
        );
      }

      const closePriceRaw = closeBlock.close;
      const closePrice = Number(closePriceRaw);
      const openPrice = Number(order.openPrice);

      if (
        closePriceRaw === undefined ||
        closePriceRaw === null ||
        isNaN(closePrice) ||
        isNaN(openPrice)
      ) {
        console.error('[CLOSE_ORDER] Invalid price data', {
          openPrice: order.openPrice,
          closePrice: closeBlock.close,
        });
        throw new BadRequestException(
          `Invalid price data (open=${order.openPrice}, close=${closeBlock.close})`,
        );
      }

      order.closePrice = closePrice;

      // 🔹 Tính toán kết quả
      const priceDiff = closePrice - openPrice;
      let result: 'WIN' | 'LOSE' | 'DRAW' = 'DRAW';

      if (priceDiff === 0) {
        result = 'DRAW';
        order.status = OrderStatus.DRAW;
        order.profitAmount = 0;

        await this.walletService.unlockBalance(
          order.userId,
          Number(order.investAmount),
        );
      } else if (
        (order.direction === OrderDirection.UP && priceDiff > 0) ||
        (order.direction === OrderDirection.DOWN && priceDiff < 0)
      ) {
        result = 'WIN';
        order.status = OrderStatus.WON;
        order.profitAmount =
          (Number(order.investAmount) * order.profitPercentage) / 100;

        // 🔹 Validate profitAmount
        if (isNaN(order.profitAmount)) {
          console.error(`[CLOSE_ORDER] Failed to calculate profit amount`, {
            orderId: order.id,
            investAmount: order.investAmount,
            profitPercentage: order.profitPercentage,
            result: order.profitAmount,
          });
          throw new BadRequestException(
            `Failed to calculate profit amount. investAmount: ${order.investAmount}, profitPercentage: ${order.profitPercentage}`,
          );
        }

        await this.walletService.processTradeWin(
          order.userId,
          Number(order.investAmount),
          Number(order.profitAmount),
          order.id,
        );
      } else {
        result = 'LOSE';
        order.status = OrderStatus.LOST;
        order.profitAmount = -Number(order.investAmount);

        // 🔹 Validate profitAmount
        if (isNaN(order.profitAmount)) {
          console.error(`[CLOSE_ORDER] Failed to calculate loss amount`, {
            orderId: order.id,
            investAmount: order.investAmount,
            result: order.profitAmount,
          });
          throw new BadRequestException(
            `Failed to calculate loss amount. investAmount: ${order.investAmount}`,
          );
        }

        await this.walletService.processTradeLoss(
          order.userId,
          Number(order.investAmount),
          order.id,
        );
      }

      console.log(`[CLOSE_ORDER] Result: ${result}`, {
        openPrice,
        closePrice,
        diff: priceDiff,
        profit: order.profitAmount,
        investAmount: order.investAmount,
        profitPercentage: order.profitPercentage,
      });

      await queryRunner.manager.save(order);

      // 🔹 Cập nhật thống kê
      await this.updatePositionStats(order.userId, order.status, order);

      await queryRunner.commitTransaction();
      console.log(`[CLOSE_ORDER] ✅ Completed ${order.id}`);

      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(`[CLOSE_ORDER] ❌ Error for order ${orderId}`, error.message);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
/**
 * Cập nhật thống kê position
 */
private async updatePositionStats(
  userId: string,
  orderStatus: OrderStatus,
  order: Order,
): Promise<void> {
  let position = await this.positionRepository.findOne({
    where: { userId },
  });

  if (!position) {
    position = this.positionRepository.create({ userId });
  }

  // 🔹 Đảm bảo các giá trị là số hợp lệ, khởi tạo giá trị mặc định nếu undefined/null
  const investAmount = Number(order.investAmount) || 0;
  const profitAmount = Number(order.profitAmount) || 0;
  
  // Validate trước khi tính toán
  if (isNaN(investAmount)) {
    console.error(`[UPDATE_POSITION_STATS] Invalid investAmount for order ${order.id}: ${order.investAmount}`);
    throw new BadRequestException('Invalid investment amount');
  }

  // 🔹 Khởi tạo các giá trị mặc định nếu chưa có
  position.totalTrades = position.totalTrades || 0;
  position.totalWins = position.totalWins || 0;
  position.totalLosses = position.totalLosses || 0;
  position.totalDraws = position.totalDraws || 0;
  position.currentStreak = position.currentStreak || 0;
  position.bestStreak = position.bestStreak || 0;
  position.worstStreak = position.worstStreak || 0;
  position.winRate = position.winRate || 0;

  position.totalTrades += 1;
  
  // 🔹 Sử dụng giá trị đã validate và xử lý undefined/null
  const currentTotalInvested = Number(position.totalInvested) || 0;
  position.totalInvested = currentTotalInvested + investAmount;

  if (orderStatus === OrderStatus.WON) {
    if (isNaN(profitAmount)) {
      console.error(`[UPDATE_POSITION_STATS] Invalid profitAmount for order ${order.id}: ${order.profitAmount}`);
      throw new BadRequestException('Invalid profit amount');
    }

    position.totalWins += 1;
    
    const currentTotalProfit = Number(position.totalProfit) || 0;
    position.totalProfit = currentTotalProfit + profitAmount;
    
    position.currentStreak =
      position.currentStreak >= 0 ? position.currentStreak + 1 : 1;
    if (position.currentStreak > position.bestStreak) {
      position.bestStreak = position.currentStreak;
    }
  } else if (orderStatus === OrderStatus.LOST) {
    position.totalLosses += 1;
    
    // 🔹 XỬ LÝ: Khởi tạo giá trị mặc định cho totalLoss nếu undefined/null
    const currentTotalLoss = Number(position.totalLoss) || 0;
    const lossAmount = Math.abs(profitAmount);
    
    if (isNaN(lossAmount)) {
      console.error(`[UPDATE_POSITION_STATS] Invalid loss amount for order ${order.id}: ${profitAmount}`);
      throw new BadRequestException('Invalid loss amount');
    }
    
    position.totalLoss = currentTotalLoss + lossAmount;
    
    position.currentStreak =
      position.currentStreak <= 0 ? position.currentStreak - 1 : -1;
    if (position.currentStreak < position.worstStreak) {
      position.worstStreak = position.currentStreak;
    }
  } else if (orderStatus === OrderStatus.DRAW) {
    position.totalDraws += 1;
    position.currentStreak = 0;
  }

  // Calculate win rate
  if (position.totalTrades > 0) {
    position.winRate = (position.totalWins / position.totalTrades) * 100;
  } else {
    position.winRate = 0;
  }

  // 🔹 Validate tất cả các giá trị trước khi save
  // Đảm bảo không có giá trị undefined
  position.totalInvested = Number(position.totalInvested) || 0;
  position.totalProfit = Number(position.totalProfit) || 0;
  position.totalLoss = Number(position.totalLoss) || 0;
  position.winRate = Number(position.winRate) || 0;

  const fieldsToValidate = {
    totalInvested: position.totalInvested,
    totalProfit: position.totalProfit,
    totalLoss: position.totalLoss,
    winRate: position.winRate,
  };

  for (const [field, value] of Object.entries(fieldsToValidate)) {
    if (isNaN(Number(value)) || value === undefined || value === null) {
      console.error(`[UPDATE_POSITION_STATS] Invalid ${field}: ${value} for user ${userId}`, {
        position: {
          totalInvested: position.totalInvested,
          totalProfit: position.totalProfit,
          totalLoss: position.totalLoss,
          winRate: position.winRate,
        }
      });
      throw new BadRequestException(`Invalid ${field} value`);
    }
  }

  console.log(`[UPDATE_POSITION_STATS] Saving position for user ${userId}:`, {
    totalTrades: position.totalTrades,
    totalInvested: position.totalInvested,
    totalProfit: position.totalProfit,
    totalLoss: position.totalLoss,
    winRate: position.winRate,
  });

  await this.positionRepository.save(position);
}

  /**
   * Lấy danh sách orders của user
   */
  async getUserOrders(
    userId: string,
    status?: OrderStatus,
    limit: number = 50,
  ): Promise<Order[]> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.asset', 'asset')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC')
      .limit(limit);

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    return await query.getMany();
  }

  /**
   * Lấy active orders của user
   */
  async getActiveOrders(userId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { userId, status: OrderStatus.ACTIVE },
      relations: ['asset'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy position statistics
   */
  async getPositionStats(userId: string): Promise<Position> {
    let position = await this.positionRepository.findOne({
      where: { userId },
    });

    if (!position) {
      position = this.positionRepository.create({ userId });
      await this.positionRepository.save(position);
    }

    return position;
  }

  /**
   * Lấy chi tiết order
   */
  async getOrderById(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
      relations: ['asset'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Hủy order (chỉ khi còn PENDING hoặc chưa hết thời gian)
   */
  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await this.getOrderById(orderId, userId);

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.ACTIVE) {
      throw new BadRequestException('Cannot cancel this order');
    }

    // Unlock balance
    await this.walletService.unlockBalance(userId, Number(order.investAmount));

    order.status = OrderStatus.CANCELLED;
    return await this.orderRepository.save(order);
  }
}