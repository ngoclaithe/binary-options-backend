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
   * Lưu ý: Chỉ đóng order khi đã qua 2 phút kể từ closeTime (để có data)
   */
  @Cron('*/10 * * * * *')
  async settleExpiredOrders() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const currentTime = Date.now();
      
      // 🔹 Tìm orders đã hết hạn VÀ đã qua 2 phút (để có dữ liệu giá)
      const twoMinutesAgo = currentTime - (2 * 60 * 1000);

      const expiredOrders = await this.orderRepository.find({
        where: {
          status: OrderStatus.ACTIVE,
          closeTime: LessThanOrEqual(twoMinutesAgo), // closeTime + 2 phút <= now
        },
        relations: ['asset', 'user'],
      });

      if (expiredOrders.length === 0) {
        return;
      }

      this.logger.log(
        `Found ${expiredOrders.length} expired orders to settle (with 2-min delay)`,
      );

      let successCount = 0;
      let failCount = 0;

      // Đóng từng lệnh
      for (const order of expiredOrders) {
        try {
          const timeSinceClose = currentTime - Number(order.closeTime);
          const minutesSinceClose = Math.floor(timeSinceClose / 60000);

          this.logger.debug(
            `Settling order ${order.id} - Close time: ${new Date(Number(order.closeTime)).toISOString()}, ` +
            `Time since close: ${minutesSinceClose}m ${Math.floor((timeSinceClose % 60000) / 1000)}s`,
          );

          const closedOrder = await this.tradingService.closeOrder(order.id);

          // Notify user qua WebSocket
          this.tradingGateway.notifyOrderClosed(order.userId, closedOrder);

          successCount++;

          this.logger.log(
            `✅ Settled order ${order.id} for user ${order.userId} - Status: ${closedOrder.status}, ` +
            `Open: ${closedOrder.openPrice}, Close: ${closedOrder.closePrice}, Profit: ${closedOrder.profitAmount}`,
          );
        } catch (error) {
          failCount++;
          this.logger.error(
            `❌ Failed to settle order ${order.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Settlement completed: ${successCount} succeeded, ${failCount} failed`,
      );
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