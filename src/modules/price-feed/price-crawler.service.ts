import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

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

@Injectable()
export class PriceCrawlerService {
  private readonly logger = new Logger(PriceCrawlerService.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('app.priceApiUrl') ||
      'https://api.binance.com/api/v3';
  }

  /**
   * Fetch giá từ Binance API
   */
  async fetchPriceFromBinance(symbol: string): Promise<PriceData | null> {
    try {
      // Lấy giá hiện tại
      const tickerResponse = await axios.get(`${this.baseUrl}/ticker/price`, {
        params: { symbol },
      });

      // Lấy thông tin 24h
      const ticker24hResponse = await axios.get(`${this.baseUrl}/ticker/24hr`, {
        params: { symbol },
      });             

      const ticker24h = ticker24hResponse.data;

      return {
        symbol: symbol,
        price: parseFloat(tickerResponse.data.price),
        timestamp: Date.now(),
        open: parseFloat(ticker24h.openPrice),
        high: parseFloat(ticker24h.highPrice),
        low: parseFloat(ticker24h.lowPrice),
        close: parseFloat(ticker24h.lastPrice),
        volume: parseFloat(ticker24h.volume),
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch price for ${symbol} from Binance: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Fetch giá từ API khác (ví dụ: CoinGecko, Alpha Vantage, etc.)
   */
  async fetchPriceFromAlternative(symbol: string): Promise<PriceData | null> {
    try {
      // Ví dụ với CoinGecko API
      const coinGeckoUrl = 'https://api.coingecko.com/api/v3';
      const coinId = this.mapSymbolToCoinGeckoId(symbol);

      if (!coinId) {
        return null;
      }

      const response = await axios.get(`${coinGeckoUrl}/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true,
        },
      });

      const data = response.data[coinId];

      return {
        symbol: symbol,
        price: data.usd,
        timestamp: Date.now(),
        volume: data.usd_24h_vol,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch price for ${symbol} from alternative API: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Fetch multiple prices at once
   */
  async fetchMultiplePrices(symbols: string[]): Promise<PriceData[]> {
    const promises = symbols.map((symbol) => this.fetchPriceFromBinance(symbol));
    const results = await Promise.allSettled(promises);

    return results
      .filter((result) => result.status === 'fulfilled' && result.value !== null)
      .map((result: any) => result.value);
  }

  /**
   * Map symbol to CoinGecko ID
   */
  private mapSymbolToCoinGeckoId(symbol: string): string | null {
    const mapping: Record<string, string> = {
      BTCUSDT: 'bitcoin',
      ETHUSDT: 'ethereum',
      BNBUSDT: 'binancecoin',
      ADAUSDT: 'cardano',
      DOGEUSDT: 'dogecoin',
      XRPUSDT: 'ripple',
      DOTUSDT: 'polkadot',
      UNIUSDT: 'uniswap',
      LINKUSDT: 'chainlink',
      LTCUSDT: 'litecoin',
    };

    return mapping[symbol] || null;
  }

  /**
   * Generate mock price data for testing
   */
  generateMockPrice(
    symbol: string,
    basePrice: number = 50000,
  ): PriceData {
    const change = (Math.random() - 0.5) * basePrice * 0.02; // ±2% change
    const price = basePrice + change;

    return {
      symbol,
      price,
      timestamp: Date.now(),
      open: basePrice,
      high: price + Math.random() * 100,
      low: price - Math.random() * 100,
      close: price,
      volume: Math.random() * 1000000,
    };
  }
}