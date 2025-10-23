import { Repository } from 'typeorm';
import { Price } from './entities/price.entity';
import { DetailedPriceData } from './entities/detailed-price-data.entity';
import { PriceCrawlerService, PriceData } from './price-crawler.service';
export declare class PriceFeedService {
    private readonly priceRepository;
    private readonly detailedPriceRepo;
    private readonly priceCrawlerService;
    private readonly logger;
    private latestPrices;
    constructor(priceRepository: Repository<Price>, detailedPriceRepo: Repository<DetailedPriceData>, priceCrawlerService: PriceCrawlerService);
    getLatestPrice(symbol: string): Promise<any>;
    savePrice(priceData: PriceData): Promise<Price>;
    savePrices(pricesData: PriceData[]): Promise<Price[]>;
    getPriceHistory(symbol: string, startTime: number, endTime: number, limit?: number): Promise<Price[]>;
    getPricesByInterval(symbol: string, interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', limit?: number): Promise<Price[]>;
    cleanupOldPrices(olderThanDays?: number): Promise<number>;
    getAllLatestPrices(): PriceData[];
    private getIntervalInMs;
    initializeCache(symbols: string[]): Promise<void>;
    getPriceByTimestamp(symbol: string, targetMinuteTimestamp: number): Promise<{
        symbol: string;
        minuteTimestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
    } | null>;
}
