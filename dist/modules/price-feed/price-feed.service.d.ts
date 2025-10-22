import { Repository } from 'typeorm';
import { Price } from './entities/price.entity';
import { PriceCrawlerService, PriceData } from './price-crawler.service';
export declare class PriceFeedService {
    private readonly priceRepository;
    private readonly priceCrawlerService;
    private readonly logger;
    private latestPrices;
    constructor(priceRepository: Repository<Price>, priceCrawlerService: PriceCrawlerService);
    savePrice(priceData: PriceData): Promise<Price>;
    savePrices(pricesData: PriceData[]): Promise<Price[]>;
    getLatestPrice(symbol: string): Promise<PriceData | null>;
    getPriceHistory(symbol: string, startTime: number, endTime: number, limit?: number): Promise<Price[]>;
    getPricesByInterval(symbol: string, interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', limit?: number): Promise<Price[]>;
    cleanupOldPrices(olderThanDays?: number): Promise<number>;
    getAllLatestPrices(): PriceData[];
    private getIntervalInMs;
    initializeCache(symbols: string[]): Promise<void>;
}
