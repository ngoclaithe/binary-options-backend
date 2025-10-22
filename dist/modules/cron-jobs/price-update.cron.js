"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PriceUpdateCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceUpdateCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const price_crawler_service_1 = require("../price-feed/price-crawler.service");
const price_feed_service_1 = require("../price-feed/price-feed.service");
const price_feed_gateway_1 = require("../price-feed/price-feed.gateway");
const assets_service_1 = require("../assets/assets.service");
let PriceUpdateCron = PriceUpdateCron_1 = class PriceUpdateCron {
    priceCrawlerService;
    priceFeedService;
    priceFeedGateway;
    assetsService;
    logger = new common_1.Logger(PriceUpdateCron_1.name);
    isRunning = false;
    constructor(priceCrawlerService, priceFeedService, priceFeedGateway, assetsService) {
        this.priceCrawlerService = priceCrawlerService;
        this.priceFeedService = priceFeedService;
        this.priceFeedGateway = priceFeedGateway;
        this.assetsService = assetsService;
    }
    async updatePrices() {
        if (this.isRunning) {
            this.logger.warn('Price update is already running, skipping...');
            return;
        }
        this.isRunning = true;
        try {
            this.logger.log('Starting price update...');
            const activeAssets = await this.assetsService.findActive();
            if (activeAssets.length === 0) {
                this.logger.warn('No active assets found');
                return;
            }
            const symbols = activeAssets
                .map((asset) => asset.apiSymbol)
                .filter((symbol) => symbol);
            const pricesData = await this.priceCrawlerService.fetchMultiplePrices(symbols);
            if (pricesData.length === 0) {
                this.logger.warn('No prices fetched');
                return;
            }
            await this.priceFeedService.savePrices(pricesData);
            this.priceFeedGateway.broadcastPriceUpdates(pricesData);
            this.logger.log(`Successfully updated ${pricesData.length} prices`);
        }
        catch (error) {
            this.logger.error(`Failed to update prices: ${error.message}`, error.stack);
        }
        finally {
            this.isRunning = false;
        }
    }
    async onModuleInit() {
        this.logger.log('Initializing price cache...');
        try {
            const activeAssets = await this.assetsService.findActive();
            const symbols = activeAssets
                .map((asset) => asset.symbol)
                .filter((symbol) => symbol);
            await this.priceFeedService.initializeCache(symbols);
            this.logger.log('Price cache initialized successfully');
            await this.updatePrices();
        }
        catch (error) {
            this.logger.error(`Failed to initialize price cache: ${error.message}`, error.stack);
        }
    }
};
exports.PriceUpdateCron = PriceUpdateCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PriceUpdateCron.prototype, "updatePrices", null);
exports.PriceUpdateCron = PriceUpdateCron = PriceUpdateCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [price_crawler_service_1.PriceCrawlerService,
        price_feed_service_1.PriceFeedService,
        price_feed_gateway_1.PriceFeedGateway,
        assets_service_1.AssetsService])
], PriceUpdateCron);
//# sourceMappingURL=price-update.cron.js.map