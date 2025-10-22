import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from '../../trading/entities/order.entity';

export enum AssetType {
  CRYPTO = 'crypto',
  FOREX = 'forex',
  STOCK = 'stock',
  COMMODITY = 'commodity',
}

export enum AssetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  symbol: string; // BTC/USDT, EUR/USD, etc.

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: AssetType,
  })
  type: AssetType;

  @Column({
    type: 'enum',
    enum: AssetStatus,
    default: AssetStatus.ACTIVE,
  })
  status: AssetStatus;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  minTradeAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 10000 })
  maxTradeAmount: number;

  @Column('int', { default: 85 })
  profitPercentage: number; 

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ nullable: true })
  apiSymbol: string;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Order, (order) => order.asset)
  orders: Order[];
}