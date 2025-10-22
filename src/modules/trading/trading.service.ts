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
  ) {}

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

      // Get current price
      const currentPrice = await this.priceFeedService.getLatestPrice(
        asset.apiSymbol || asset.symbol,
      );

      if (!currentPrice) {
        throw new BadRequestException('Cannot get current price');
      }

      const openTime = Date.now();
      const closeTime = openTime + createOrderDto.duration * 1000;

      // Create order
      const order = queryRunner.manager.create(Order, {
        userId,
        assetId: createOrderDto.assetId,
        direction: createOrderDto.direction,
        investAmount: createOrderDto.investAmount,
        openPrice: currentPrice.price,
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
        throw new NotFoundException('Order not found');
      }

      if (order.status !== OrderStatus.ACTIVE) {
        throw new BadRequestException('Order is not active');
      }

      // Get close price
      const closePrice = await this.priceFeedService.getLatestPrice(
        order.asset.apiSymbol || order.asset.symbol,
      );

      if (!closePrice) {
        throw new BadRequestException('Cannot get close price');
      }

      order.closePrice = closePrice.price;

      // Determine win/loss
      const priceChange = Number(closePrice.price) - Number(order.openPrice);
      let isWin = false;

      if (order.direction === OrderDirection.UP) {
        isWin = priceChange > 0;
      } else {
        isWin = priceChange < 0;
      }

      // Check for draw (same price)
      if (priceChange === 0) {
        order.status = OrderStatus.DRAW;
        order.profitAmount = 0;
        // Refund investment
        await this.walletService.unlockBalance(
          order.userId,
          Number(order.investAmount),
        );
      } else if (isWin) {
        order.status = OrderStatus.WON;
        order.profitAmount =
          (Number(order.investAmount) * order.profitPercentage) / 100;

        // Process win
        await this.walletService.processTradeWin(
          order.userId,
          Number(order.investAmount),
          Number(order.profitAmount),
          order.id,
        );
      } else {
        order.status = OrderStatus.LOST;
        order.profitAmount = -Number(order.investAmount);

        // Process loss
        await this.walletService.processTradeLoss(
          order.userId,
          Number(order.investAmount),
          order.id,
        );
      }

      await queryRunner.manager.save(order);

      // Update position statistics
      await this.updatePositionStats(order.userId, order.status, order);

      await queryRunner.commitTransaction();

      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
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

    position.totalTrades += 1;
    position.totalInvested =
      Number(position.totalInvested) + Number(order.investAmount);

    if (orderStatus === OrderStatus.WON) {
      position.totalWins += 1;
      position.totalProfit =
        Number(position.totalProfit) + Number(order.profitAmount);
      position.currentStreak =
        position.currentStreak >= 0 ? position.currentStreak + 1 : 1;
      if (position.currentStreak > position.bestStreak) {
        position.bestStreak = position.currentStreak;
      }
    } else if (orderStatus === OrderStatus.LOST) {
      position.totalLosses += 1;
      position.totalLoss =
        Number(position.totalLoss) + Math.abs(Number(order.profitAmount));
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
    }

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