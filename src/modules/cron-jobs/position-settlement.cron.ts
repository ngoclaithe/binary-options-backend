import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Order, OrderStatus } from '../trading/entities/order.entity';
import { TradingService } from '../trading/trading.service';
import { TradingGateway } from '../trading/trading.gateway';

@Injectable()
export class PositionSettlementCron {
  private readonly logger = new Logger(PositionSettlementCron.name);
  private isRunning = false;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly tradingService: TradingService,
    private readonly tradingGateway: TradingGateway,
  ) {}

  /**
   * Cron job chạy mỗi 10 giây để đóng các lệnh đã hết hạn
   */
  @Cron('*/10 * * * * *')
  async settleExpiredOrders() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const currentTime = Date.now();

      // Tìm các orders active đã hết hạn
      const expiredOrders = await this.orderRepository.find({
        where: {
          status: OrderStatus.ACTIVE,
          closeTime: LessThanOrEqual(currentTime),
        },
        relations: ['asset', 'user'],
      });

      if (expiredOrders.length === 0) {
        return;
      }

      this.logger.log(`Found ${expiredOrders.length} expired orders to settle`);

      // Đóng từng lệnh
      for (const order of expiredOrders) {
        try {
          const closedOrder = await this.tradingService.closeOrder(order.id);

          // Notify user qua WebSocket
          this.tradingGateway.notifyOrderClosed(order.userId, closedOrder);

          this.logger.log(
            `Settled order ${order.id} for user ${order.userId} - Status: ${closedOrder.status}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to settle order ${order.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(`Successfully settled ${expiredOrders.length} orders`);
    } catch (error) {
      this.logger.error(
        `Failed to settle expired orders: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Cron job chạy mỗi ngày lúc 2:00 AM để cleanup dữ liệu cũ
   */
  @Cron('0 2 * * *')
  async cleanupOldData() {
    try {
      this.logger.log('Starting cleanup of old data...');

      // Cleanup old prices (giữ lại 30 ngày)
      const priceFeedService = this.tradingService['priceFeedService'];
      if (priceFeedService && priceFeedService.cleanupOldPrices) {
        await priceFeedService.cleanupOldPrices(30);
      }

      this.logger.log('Cleanup completed successfully');
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old data: ${error.message}`,
        error.stack,
      );
    }
  }
}