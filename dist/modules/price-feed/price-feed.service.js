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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PriceFeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceFeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const price_entity_1 = require("./entities/price.entity");
const price_crawler_service_1 = require("./price-crawler.service");
let PriceFeedService = PriceFeedService_1 = class PriceFeedService {
    priceRepository;
    priceCrawlerService;
    logger = new common_1.Logger(PriceFeedService_1.name);
    latestPrices = new Map();
    constructor(priceRepository, priceCrawlerService) {
        this.priceRepository = priceRepository;
        this.priceCrawlerService = priceCrawlerService;
    }
    async savePrice(priceData) {
        const price = this.priceRepository.create({
            symbol: priceData.symbol,
            price: priceData.price,
            open: priceData.open,
            high: priceData.high,
            low: priceData.low,
            close: priceData.close,
            volume: priceData.volume,
            timestamp: priceData.timestamp,
        });
        const savedPrice = await this.priceRepository.save(price);
        this.latestPrices.set(priceData.symbol, priceData);
        this.logger.debug(`Saved price for ${priceData.symbol}: $${priceData.price}`);
        return savedPrice;
    }
    async savePrices(pricesData) {
        const prices = pricesData.map((data) => this.priceRepository.create({
            symbol: data.symbol,
            price: data.price,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
            timestamp: data.timestamp,
        }));
        const savedPrices = await this.priceRepository.save(prices);
        pricesData.forEach((data) => {
            this.latestPrices.set(data.symbol, data);
        });
        this.logger.log(`Saved ${savedPrices.length} prices to database`);
        return savedPrices;
    }
    async getLatestPrice(symbol) {
        if (this.latestPrices.has(symbol)) {
            return this.latestPrices.get(symbol) ?? null;
        }
        const price = await this.priceRepository.findOne({
            where: { symbol },
            order: { timestamp: 'DESC' },
        });
        if (price) {
            const priceData = {
                symbol: price.symbol,
                price: Number(price.price),
                timestamp: Number(price.timestamp),
                open: price.open ? Number(price.open) : undefined,
                high: price.high ? Number(price.high) : undefined,
                low: price.low ? Number(price.low) : undefined,
                close: price.close ? Number(price.close) : undefined,
                volume: price.volume ? Number(price.volume) : undefined,
            };
            this.latestPrices.set(symbol, priceData);
            return priceData;
        }
        return null;
    }
    async getPriceHistory(symbol, startTime, endTime, limit = 1000) {
        return await this.priceRepository
            .createQueryBuilder('price')
            .where('price.symbol = :symbol', { symbol })
            .andWhere('price.timestamp >= :startTime', { startTime })
            .andWhere('price.timestamp <= :endTime', { endTime })
            .orderBy('price.timestamp', 'ASC')
            .limit(limit)
            .getMany();
    }
    async getPricesByInterval(symbol, interval, limit = 100) {
        const intervalMs = this.getIntervalInMs(interval);
        const startTime = Date.now() - intervalMs * limit;
        return await this.priceRepository.find({
            where: {
                symbol,
                timestamp: (0, typeorm_2.LessThan)(Date.now()),
            },
            order: { timestamp: 'DESC' },
            take: limit,
        });
    }
    async cleanupOldPrices(olderThanDays = 30) {
        const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
        const result = await this.priceRepository.delete({
            timestamp: (0, typeorm_2.LessThan)(cutoffTime),
        });
        this.logger.log(`Cleaned up ${result.affected} old price records`);
        return result.affected || 0;
    }
    getAllLatestPrices() {
        return Array.from(this.latestPrices.values());
    }
    getIntervalInMs(interval) {
        const intervals = {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '4h': 4 * 60 * 60 * 1000,
            '1d': 24 * 60 * 60 * 1000,
        };
        return intervals[interval] || 60 * 1000;
    }
    async initializeCache(symbols) {
        for (const symbol of symbols) {
            const price = await this.priceRepository.findOne({
                where: { symbol },
                order: { timestamp: 'DESC' },
            });
            if (price) {
                const priceData = {
                    symbol: price.symbol,
                    price: Number(price.price),
                    timestamp: Number(price.timestamp),
                    open: price.open ? Number(price.open) : undefined,
                    high: price.high ? Number(price.high) : undefined,
                    low: price.low ? Number(price.low) : undefined,
                    close: price.close ? Number(price.close) : undefined,
                    volume: price.volume ? Number(price.volume) : undefined,
                };
                this.latestPrices.set(symbol, priceData);
            }
        }
        this.logger.log(`Initialized cache with ${this.latestPrices.size} prices`);
    }
};
exports.PriceFeedService = PriceFeedService;
exports.PriceFeedService = PriceFeedService = PriceFeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(price_entity_1.Price)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        price_crawler_service_1.PriceCrawlerService])
], PriceFeedService);
//# sourceMappingURL=price-feed.service.js.map