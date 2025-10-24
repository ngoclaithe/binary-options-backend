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
   * Tạo lệnh mới - Lấy giá tại thời điểm tạo
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

      // 🔹 Lấy giá feed mới nhất (delay 2 phút)
      const latestFeed = await this.priceFeedService.getLatestPrice(symbol);
      if (!latestFeed) {
        throw new BadRequestException('Cannot get latest feed price');
      }

      // 🔹 Lấy timestamp hiện tại trong minuteTimestamp (giây thứ mấy trong phút)
      const now = Date.now();
      const currentMinuteTimestamp = Math.floor(latestFeed.minuteTimestamp / 60000) * 60000;
      const secondsIntoMinute = Math.floor((now - currentMinuteTimestamp) / 1000);

      // 🔹 Tìm dữ liệu giá tại giây hiện tại trong secondsData
      const currentSecondData = latestFeed.secondsData.find(
        (s: any) => s.second === secondsIntoMinute
      );

      if (!currentSecondData) {
        throw new BadRequestException(
          `No price data found for second ${secondsIntoMinute} in current minute`
        );
      }

      // 🔹 openPrice chính là close price tại giây hiện tại
      const openPrice = currentSecondData.close;
      const openTime = now;

      // 🔹 Tính closeTime = openTime + duration
      const closeTime = openTime + createOrderDto.duration * 1000;

      console.log(`[CREATE_ORDER] Order created`, {
        userId,
        symbol,
        openTime: new Date(openTime).toISOString(),
        openPrice,
        closeTime: new Date(closeTime).toISOString(),
        duration: createOrderDto.duration,
        currentMinute: new Date(currentMinuteTimestamp).toISOString(),
        secondInMinute: secondsIntoMinute,
      });

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

      console.log(`[CLOSE_ORDER] Start closing order`, {
        id: order.id,
        symbol,
        openPrice: order.openPrice,
        openTime: new Date(Number(order.openTime)).toISOString(),
        closeTime: new Date(Number(order.closeTime)).toISOString(),
      });

      // 🔹 Tính toán minuteTimestamp và second cho closeTime
      const closeTimeMs = Number(order.closeTime);
      const closeMinuteTimestamp = Math.floor(closeTimeMs / 60000) * 60000;
      const closeSecondInMinute = Math.floor((closeTimeMs - closeMinuteTimestamp) / 1000);

      console.log(`[CLOSE_ORDER] Calculated close position`, {
        closeTimeMs,
        closeMinute: new Date(closeMinuteTimestamp).toISOString(),
        closeSecondInMinute,
      });

      // 🔹 Lấy dữ liệu phút tương ứng
      const closeMinuteData = await this.priceFeedService.getPriceByTimestamp(
        symbol,
        closeMinuteTimestamp,
      );

      if (!closeMinuteData) {
        throw new BadRequestException(
          `No price data found for ${symbol} at minute ${new Date(closeMinuteTimestamp).toISOString()}`
        );
      }

      // 🔹 Lấy chi tiết 60 giây để tìm giá đóng chính xác
      const detailedData = await this.priceFeedService.getDetailedPriceData(
        symbol,
        closeMinuteTimestamp,
      );

      if (!detailedData || !detailedData.secondsData) {
        throw new BadRequestException(
          `No detailed seconds data found for ${symbol} at ${new Date(closeMinuteTimestamp).toISOString()}`
        );
      }

      // 🔹 Tìm giá tại giây cụ thể
      const closeSecondData = detailedData.secondsData.find(
        (s: any) => s.second === closeSecondInMinute
      );

      if (!closeSecondData) {
        console.warn(`[CLOSE_ORDER] No exact second data, using minute close price`);
        // Fallback: sử dụng close của phút nếu không tìm thấy giây cụ thể
        order.closePrice = Number(closeMinuteData.close);
      } else {
        order.closePrice = Number(closeSecondData.close);
      }

      console.log(`[CLOSE_ORDER] Price data`, {
        openPrice: order.openPrice,
        closePrice: order.closePrice,
        closeSecond: closeSecondInMinute,
      });

      const closePrice = Number(order.closePrice);
      const openPrice = Number(order.openPrice);

      if (isNaN(closePrice) || isNaN(openPrice)) {
        console.error('[CLOSE_ORDER] Invalid price data', {
          openPrice: order.openPrice,
          closePrice: order.closePrice,
        });
        throw new BadRequestException(
          `Invalid price data (open=${order.openPrice}, close=${order.closePrice})`,
        );
      }

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

        if (isNaN(order.profitAmount)) {
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

        if (isNaN(order.profitAmount)) {
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
      });

      await queryRunner.manager.save(order);
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

    const investAmount = Number(order.investAmount) || 0;
    const profitAmount = Number(order.profitAmount) || 0;
    
    if (isNaN(investAmount)) {
      throw new BadRequestException('Invalid investment amount');
    }

    position.totalTrades = position.totalTrades || 0;
    position.totalWins = position.totalWins || 0;
    position.totalLosses = position.totalLosses || 0;
    position.totalDraws = position.totalDraws || 0;
    position.currentStreak = position.currentStreak || 0;
    position.bestStreak = position.bestStreak || 0;
    position.worstStreak = position.worstStreak || 0;
    position.winRate = position.winRate || 0;

    position.totalTrades += 1;
    
    const currentTotalInvested = Number(position.totalInvested) || 0;
    position.totalInvested = currentTotalInvested + investAmount;

    if (orderStatus === OrderStatus.WON) {
      if (isNaN(profitAmount)) {
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
      
      const currentTotalLoss = Number(position.totalLoss) || 0;
      const lossAmount = Math.abs(profitAmount);
      
      if (isNaN(lossAmount)) {
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

    if (position.totalTrades > 0) {
      position.winRate = (position.totalWins / position.totalTrades) * 100;
    } else {
      position.winRate = 0;
    }

    position.totalInvested = Number(position.totalInvested) || 0;
    position.totalProfit = Number(position.totalProfit) || 0;
    position.totalLoss = Number(position.totalLoss) || 0;
    position.winRate = Number(position.winRate) || 0;

    await this.positionRepository.save(position);
  }

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

  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await this.getOrderById(orderId, userId);

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.ACTIVE) {
      throw new BadRequestException('Cannot cancel this order');
    }

    await this.walletService.unlockBalance(userId, Number(order.investAmount));

    order.status = OrderStatus.CANCELLED;
    return await this.orderRepository.save(order);
  }
}