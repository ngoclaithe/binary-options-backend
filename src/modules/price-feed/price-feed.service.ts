import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Price } from './entities/price.entity';
import { DetailedPriceData } from './entities/detailed-price-data.entity';
import { PriceCrawlerService, PriceData } from './price-crawler.service';

@Injectable()
export class PriceFeedService {
  private readonly logger = new Logger(PriceFeedService.name);
  private latestPrices: Map<string, PriceData> = new Map();

  constructor(
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    @InjectRepository(DetailedPriceData)
    private readonly detailedPriceRepo: Repository<DetailedPriceData>,
    private readonly priceCrawlerService: PriceCrawlerService,
  ) { }

  /**
   * Lấy giá mới nhất - trả về 60 giây của 2 phút trước
   * Ví dụ: request lúc 12:05:30 → trả về 60 giây từ 12:03:00 đến 12:03:59
   */
  async getLatestPrice(symbol: string): Promise<any> {
    try {
      const now = Date.now();

      // Lùi 2 phút so với hiện tại
      const twoMinutesAgo = now - (2 * 60 * 1000);

      // Làm tròn xuống phút
      const targetMinuteTimestamp = Math.floor(twoMinutesAgo / 60000) * 60000;

      const record = await this.detailedPriceRepo.findOne({
        where: {
          symbol,
          minuteTimestamp: targetMinuteTimestamp,
        },
      });

      if (!record) {
        this.logger.warn(
          `No detailed price data found for ${symbol} at ${new Date(targetMinuteTimestamp).toISOString()}`
        );
        return null;
      }

      // Format response
      return {
        symbol: record.symbol,
        minuteTimestamp: Number(record.minuteTimestamp),
        minuteTime: new Date(Number(record.minuteTimestamp)).toISOString(),
        summary: {
          open: Number(record.minuteOpen),
          high: Number(record.minuteHigh),
          low: Number(record.minuteLow),
          close: Number(record.minuteClose),
          volume: Number(record.minuteVolume),
        },
        secondsData: record.secondsData.map((s, index) => {
          const timestamp = Number(s.t);
          return {
            second: index,
            timestamp: timestamp,
            time: new Date(timestamp).toISOString(),
            price: Number(s.p),
            open: Number(s.o),
            high: Number(s.h),
            low: Number(s.l),
            close: Number(s.c),
            volume: Number(s.v),
          };
        }),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get latest detailed price for ${symbol}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Lưu giá vào database
   */
  async savePrice(priceData: PriceData): Promise<Price> {
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

    // Cache giá mới nhất
    this.latestPrices.set(priceData.symbol, priceData);

    this.logger.debug(
      `Saved price for ${priceData.symbol}: $${priceData.price}`,
    );

    return savedPrice;
  }

  /**
   * Lưu nhiều giá cùng lúc
   */
  async savePrices(pricesData: PriceData[]): Promise<Price[]> {
    const prices = pricesData.map((data) =>
      this.priceRepository.create({
        symbol: data.symbol,
        price: data.price,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        timestamp: data.timestamp,
      }),
    );

    const savedPrices = await this.priceRepository.save(prices);

    // Cache giá mới nhất
    pricesData.forEach((data) => {
      this.latestPrices.set(data.symbol, data);
    });

    this.logger.log(`Saved ${savedPrices.length} prices to database`);

    return savedPrices;
  }

  /**
   * Lấy lịch sử giá theo khoảng thời gian
   */
  async getPriceHistory(
    symbol: string,
    startTime: number,
    endTime: number,
    limit: number = 1000,
  ): Promise<Price[]> {
    return await this.priceRepository
      .createQueryBuilder('price')
      .where('price.symbol = :symbol', { symbol })
      .andWhere('price.timestamp >= :startTime', { startTime })
      .andWhere('price.timestamp <= :endTime', { endTime })
      .orderBy('price.timestamp', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * Lấy giá theo khoảng thời gian cụ thể (1 phút, 5 phút, 1 giờ, etc.)
   */
  async getPricesByInterval(
    symbol: string,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
    limit: number = 100,
  ): Promise<Price[]> {
    const intervalMs = this.getIntervalInMs(interval);
    const startTime = Date.now() - intervalMs * limit;

    return await this.priceRepository.find({
      where: {
        symbol,
        timestamp: LessThan(Date.now()),
      },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Xóa dữ liệu cũ (cleanup)
   */
  async cleanupOldPrices(olderThanDays: number = 30): Promise<number> {
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    const result = await this.priceRepository.delete({
      timestamp: LessThan(cutoffTime),
    });

    this.logger.log(`Cleaned up ${result.affected} old price records`);
    return result.affected || 0;
  }

  /**
   * Lấy tất cả giá mới nhất từ cache
   */
  getAllLatestPrices(): PriceData[] {
    return Array.from(this.latestPrices.values());
  }

  /**
   * Convert interval string to milliseconds
   */
  private getIntervalInMs(interval: string): number {
    const intervals: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };
    return intervals[interval] || 60 * 1000;
  }

  /**
   * Khởi tạo cache với giá từ database
   */
  async initializeCache(symbols: string[]): Promise<void> {
    for (const symbol of symbols) {
      const price = await this.priceRepository.findOne({
        where: { symbol },
        order: { timestamp: 'DESC' },
      });

      if (price) {
        const priceData: PriceData = {
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
  async getPriceByTimestamp(symbol: string, targetMinuteTimestamp: number) {
    const record = await this.detailedPriceRepo.findOne({
      where: { symbol, minuteTimestamp: targetMinuteTimestamp },
    });

    if (!record) return null;

    return {
      symbol: record.symbol,
      minuteTimestamp: Number(record.minuteTimestamp),
      open: Number(record.minuteOpen),
      high: Number(record.minuteHigh),
      low: Number(record.minuteLow),
      close: Number(record.minuteClose),
    };
  }
}