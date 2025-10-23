import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { DetailedPriceData } from './entities/detailed-price-data.entity';
export interface PriceData {
    symbol: string;
    price: number;
    timestamp: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
}
export declare class PriceCrawlerService {
    private configService;
    private detailedPriceRepo;
    private readonly logger;
    private readonly baseUrl;
    private previousPriceData;
    constructor(configService: ConfigService, detailedPriceRepo: Repository<DetailedPriceData>);
    fetchPriceFromBinance(symbol: string): Promise<PriceData | null>;
    private generateAndSaveDetailedPrices;
    private interpolatePrice;
    private roundToMinute;
    fetchPriceFromAlternative(symbol: string): Promise<PriceData | null>;
    fetchMultiplePrices(symbols: string[]): Promise<PriceData[]>;
    private mapSymbolToCoinGeckoId;
    generateMockPrice(symbol: string, basePrice?: number): PriceData;
}
