import { ConfigService } from '@nestjs/config';
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
    private readonly logger;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    fetchPriceFromBinance(symbol: string): Promise<PriceData | null>;
    fetchPriceFromAlternative(symbol: string): Promise<PriceData | null>;
    fetchMultiplePrices(symbols: string[]): Promise<PriceData[]>;
    private mapSymbolToCoinGeckoId;
    generateMockPrice(symbol: string, basePrice?: number): PriceData;
}
