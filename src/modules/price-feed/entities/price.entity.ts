import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('prices')
@Index(['symbol', 'timestamp'])
export class Price {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  symbol: string; // BTC/USDT, EUR/USD, etc.

  @Column('decimal', { precision: 18, scale: 8 })
  price: number;

  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  open: number;

  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  high: number;

  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  low: number;

  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  close: number;

  @Column('decimal', { precision: 20, scale: 2, nullable: true })
  volume: number;

  @Column('bigint')
  @Index()
  timestamp: number; // Unix timestamp in milliseconds

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Dữ liệu bổ sung từ API

  @CreateDateColumn()
  createdAt: Date;
}