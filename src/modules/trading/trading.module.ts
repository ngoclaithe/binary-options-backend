import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';
import { TradingGateway } from './trading.gateway';
import { Order } from './entities/order.entity';
import { Position } from './entities/position.entity';
import { WalletModule } from '../wallet/wallet.module';
import { AssetsModule } from '../assets/assets.module';
import { PriceFeedModule } from '../price-feed/price-feed.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Position]),
    WalletModule,
    AssetsModule,
    PriceFeedModule,
  ],
  controllers: [TradingController],
  providers: [TradingService, TradingGateway],
  exports: [TradingService, TradingGateway],
})
export class TradingModule {}