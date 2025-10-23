import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * Dữ liệu cho 1 giây
 */
export interface SecondPriceData {
  t: number; // timestamp (milliseconds)
  p: number; // price
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

/**
 * Entity lưu trữ giá chi tiết cho 60 giây trong 1 record
 * Mỗi phút = 1 record chứa array 60 giây
 * Path: src/modules/price-feed/entities/detailed-price-data.entity.ts
 */
@Entity('detailed_price_data')
@Index(['symbol', 'minuteTimestamp'], { unique: true })
export class DetailedPriceData {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 20 })
  symbol: string;

  @Column({ 
    type: 'bigint', 
    comment: 'Timestamp của phút (làm tròn xuống phút)' 
  })
  minuteTimestamp: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, comment: 'Giá mở cửa phút' })
  minuteOpen: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, comment: 'Giá cao nhất phút' })
  minuteHigh: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, comment: 'Giá thấp nhất phút' })
  minuteLow: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, comment: 'Giá đóng cửa phút' })
  minuteClose: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, comment: 'Tổng volume phút' })
  minuteVolume: number;

  @Column({
    type: 'json',
    comment: 'Array chứa 60 giây dữ liệu: [{t, p, o, h, l, c, v}, ...]',
  })
  secondsData: SecondPriceData[];

  @CreateDateColumn()
  createdAt: Date;

  /**
   * Lấy giá tại giây cụ thể (0-59)
   */
  getPriceAtSecond(second: number): SecondPriceData | null {
    if (second < 0 || second >= this.secondsData.length) {
      return null;
    }
    return this.secondsData[second];
  }

  /**
   * Lấy giá tại timestamp cụ thể
   */
  getPriceAtTimestamp(timestamp: number): SecondPriceData | null {
    const targetSecond = Math.floor((timestamp - this.minuteTimestamp) / 1000);
    return this.getPriceAtSecond(targetSecond);
  }

  /**
   * Lấy giá gần nhất với timestamp
   */
  getClosestPrice(timestamp: number): SecondPriceData | null {
    if (this.secondsData.length === 0) return null;

    let closest = this.secondsData[0];
    let minDiff = Math.abs(timestamp - closest.t);

    for (const data of this.secondsData) {
      const diff = Math.abs(timestamp - data.t);
      if (diff < minDiff) {
        minDiff = diff;
        closest = data;
      }
    }

    return closest;
  }

  /**
   * Lấy candlestick data trong khoảng giây
   */
  getCandlestickInRange(
    startSecond: number,
    endSecond: number,
  ): {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null {
    const start = Math.max(0, startSecond);
    const end = Math.min(this.secondsData.length - 1, endSecond);

    if (start > end) return null;

    const rangeData = this.secondsData.slice(start, end + 1);
    
    return {
      open: rangeData[0].o,
      high: Math.max(...rangeData.map(d => d.h)),
      low: Math.min(...rangeData.map(d => d.l)),
      close: rangeData[rangeData.length - 1].c,
      volume: rangeData.reduce((sum, d) => sum + d.v, 0),
    };
  }
}