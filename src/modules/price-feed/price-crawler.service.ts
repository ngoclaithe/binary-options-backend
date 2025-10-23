import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { DetailedPriceData, SecondPriceData } from './entities/detailed-price-data.entity';

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
  private previousPriceData: Map<string, PriceData> = new Map();

  constructor(
    private configService: ConfigService,
    @InjectRepository(DetailedPriceData)
    private detailedPriceRepo: Repository<DetailedPriceData>,
  ) {
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

      const currentData: PriceData = {
        symbol: symbol,
        price: parseFloat(tickerResponse.data.price),
        timestamp: Date.now(),
        open: parseFloat(ticker24h.openPrice),
        high: parseFloat(ticker24h.highPrice),
        low: parseFloat(ticker24h.lowPrice),
        close: parseFloat(ticker24h.lastPrice),
        volume: parseFloat(ticker24h.volume),
      };

      // Tự động sinh 60 giây dữ liệu chi tiết và lưu
      await this.generateAndSaveDetailedPrices(symbol, currentData);

      return currentData;
    } catch (error) {
      this.logger.error(
        `Failed to fetch price for ${symbol} from Binance: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Sinh và lưu 60 giây dữ liệu chi tiết vào 1 record
   */
  private async generateAndSaveDetailedPrices(
    symbol: string,
    currentData: PriceData,
  ): Promise<void> {
    const previousData = this.previousPriceData.get(symbol);

    // Lần đầu tiên, chỉ lưu cache
    if (!previousData) {
      this.previousPriceData.set(symbol, currentData);
      return;
    }

    try {
      const secondsData: SecondPriceData[] = [];
      const minuteTimestamp = this.roundToMinute(previousData.timestamp);
      
      let minuteHigh = -Infinity;
      let minuteLow = Infinity;

      // Sinh 60 data points (1 giây/point)
      for (let i = 0; i < 60; i++) {
        const progress = i / 60;
        const timestamp = previousData.timestamp + i * 1000;

        const interpolated = this.interpolatePrice(
          previousData,
          currentData,
          progress,
        );

        // Cập nhật high/low của cả phút
        minuteHigh = Math.max(minuteHigh, interpolated.high);
        minuteLow = Math.min(minuteLow, interpolated.low);

        secondsData.push({
          t: timestamp,
          p: interpolated.price,
          o: interpolated.open,
          h: interpolated.high,
          l: interpolated.low,
          c: interpolated.close,
          v: interpolated.volume,
        });
      }

      // Tạo record cho phút này
      const detailedPrice = this.detailedPriceRepo.create({
        symbol,
        minuteTimestamp,
        minuteOpen: secondsData[0].o,
        minuteHigh,
        minuteLow,
        minuteClose: secondsData[secondsData.length - 1].c,
        minuteVolume: secondsData.reduce((sum, d) => sum + d.v, 0),
        secondsData,
      });

      await this.detailedPriceRepo.save(detailedPrice);

      this.logger.debug(
        `Saved 60 seconds data for ${symbol} at minute ${new Date(minuteTimestamp).toISOString()}`,
      );

      // Cập nhật cache
      this.previousPriceData.set(symbol, currentData);
    } catch (error) {
      this.logger.error(
        `Failed to generate detailed prices for ${symbol}: ${error.message}`,
      );
    }
  }

  /**
   * Nội suy giá giữa 2 mốc thời gian với random walk
   */
  private interpolatePrice(
    startData: PriceData,
    endData: PriceData,
    progress: number,
  ): {
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } {
    // Linear interpolation cho giá cơ bản
    const basePrice =
      startData.price + (endData.price - startData.price) * progress;

    // Thêm noise nhỏ để tạo biến động tự nhiên (±0.05%)
    const noise = (Math.random() - 0.5) * basePrice * 0.0005;
    const price = basePrice + noise;

    // Tính OHLC hợp lý
    const priceRange = Math.abs(endData.price - startData.price);
    const volatilityFactor = Math.random() * 0.3; // 0-30% của range

    const open =
      progress === 0
        ? startData.close!
        : basePrice * (1 + (Math.random() - 0.5) * 0.001);

    const close = price;

    // High/Low phải bao phủ Open và Close
    const maxOC = Math.max(open, close);
    const minOC = Math.min(open, close);

    const high = maxOC + priceRange * volatilityFactor * Math.random();
    const low = minOC - priceRange * volatilityFactor * Math.random();

    // Volume phân bổ đều với biến động ngẫu nhiên
    const baseVolume = (endData.volume! - (startData.volume || 0)) / 60;
    // Volume cao hơn ở đầu và cuối phút (U-shape)
    const volumeMultiplier = 1 + Math.abs(progress - 0.5);
    const volume = baseVolume * volumeMultiplier * (0.8 + Math.random() * 0.4);

    return {
      price,
      open,
      high,
      low,
      close,
      volume,
    };
  }

  /**
   * Làm tròn timestamp xuống phút
   */
  private roundToMinute(timestamp: number): number {
    return Math.floor(timestamp / 60000) * 60000;
  }

  /**
   * Fetch giá từ API khác (ví dụ: CoinGecko, Alpha Vantage, etc.)
   */
  async fetchPriceFromAlternative(symbol: string): Promise<PriceData | null> {
    try {
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
    const promises = symbols.map((symbol) =>
      this.fetchPriceFromBinance(symbol),
    );
    const results = await Promise.allSettled(promises);

    return results
      .filter(
        (result) => result.status === 'fulfilled' && result.value !== null,
      )
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
  generateMockPrice(symbol: string, basePrice: number = 50000): PriceData {
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