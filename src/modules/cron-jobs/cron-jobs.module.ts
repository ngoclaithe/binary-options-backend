import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceUpdateCron } from './price-update.cron';
import { PositionSettlementCron } from './position-settlement.cron';
import { Order } from '../trading/entities/order.entity';
import { PriceFeedModule } from '../price-feed/price-feed.module';
import { AssetsModule } from '../assets/assets.module';
import { TradingModule } from '../trading/trading.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    PriceFeedModule,
    AssetsModule,
    TradingModule,
  ],
  providers: [PriceUpdateCron, PositionSettlementCron],
})
export class CronJobsModule {}