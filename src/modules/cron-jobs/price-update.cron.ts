import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PriceCrawlerService } from '../price-feed/price-crawler.service';
import { PriceFeedService } from '../price-feed/price-feed.service';
import { PriceFeedGateway } from '../price-feed/price-feed.gateway';
import { AssetsService } from '../assets/assets.service';

@Injectable()
export class PriceUpdateCron {
  private readonly logger = new Logger(PriceUpdateCron.name);
  private isRunning = false;

  constructor(
    private readonly priceCrawlerService: PriceCrawlerService,
    private readonly priceFeedService: PriceFeedService,
    private readonly priceFeedGateway: PriceFeedGateway,
    private readonly assetsService: AssetsService,
  ) {}

  /**
   * Cron job chạy mỗi 1 phút để crawl giá
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async updatePrices() {
    if (this.isRunning) {
      this.logger.warn('Price update is already running, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      this.logger.log('Starting price update...');

      // Lấy danh sách assets active
      const activeAssets = await this.assetsService.findActive();

      if (activeAssets.length === 0) {
        this.logger.warn('No active assets found');
        return;
      }

      // Crawl giá cho từng asset
      const symbols = activeAssets
        .map((asset) => asset.apiSymbol)
        .filter((symbol) => symbol);

      const pricesData = await this.priceCrawlerService.fetchMultiplePrices(
        symbols,
      );

      if (pricesData.length === 0) {
        this.logger.warn('No prices fetched');
        return;
      }

      // Lưu vào database
      await this.priceFeedService.savePrices(pricesData);

      // Broadcast qua WebSocket
      this.priceFeedGateway.broadcastPriceUpdates(pricesData);

      this.logger.log(
        `Successfully updated ${pricesData.length} prices`,
      );
    } catch (error) {
      this.logger.error(`Failed to update prices: ${error.message}`, error.stack);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Cron job chạy mỗi 5 giây (cho testing - comment out khi production)
   */
  // @Cron('*/5 * * * * *')
  // async updatePricesFast() {
  //   await this.updatePrices();
  // }

  /**
   * Initialize price cache khi service start
   */
  async onModuleInit() {
    this.logger.log('Initializing price cache...');
    try {
      const activeAssets = await this.assetsService.findActive();
      const symbols = activeAssets
        .map((asset) => asset.symbol)
        .filter((symbol) => symbol);

      await this.priceFeedService.initializeCache(symbols);
      this.logger.log('Price cache initialized successfully');

      // Run initial price update
      await this.updatePrices();
    } catch (error) {
      this.logger.error(
        `Failed to initialize price cache: ${error.message}`,
        error.stack,
      );
    }
  }
}