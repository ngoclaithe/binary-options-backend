import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceFeedService } from './price-feed.service';
import { PriceCrawlerService } from './price-crawler.service';
import { PriceFeedGateway } from './price-feed.gateway';
import { Price } from './entities/price.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Price])],
  providers: [PriceFeedService, PriceCrawlerService, PriceFeedGateway],
  exports: [PriceFeedService, PriceCrawlerService, PriceFeedGateway],
})
export class PriceFeedModule {}