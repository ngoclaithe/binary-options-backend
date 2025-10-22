import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Asset } from '../../assets/entities/asset.entity';

export enum OrderDirection {
  UP = 'up', // Call - Giá tăng
  DOWN = 'down', // Put - Giá giảm
}

export enum OrderStatus {
  PENDING = 'pending', // Đang chờ
  ACTIVE = 'active', // Đang active
  WON = 'won', // Thắng
  LOST = 'lost', // Thua
  DRAW = 'draw', // Hòa
  CANCELLED = 'cancelled', // Hủy
}

@Entity('orders')
@Index(['userId', 'status'])
@Index(['assetId', 'status'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  assetId: string;

  @Column({
    type: 'enum',
    enum: OrderDirection,
  })
  direction: OrderDirection;

  @Column('decimal', { precision: 15, scale: 2 })
  investAmount: number;

  @Column('decimal', { precision: 18, scale: 8 })
  openPrice: number;

  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  closePrice: number;

  @Column('bigint')
  openTime: number; // Unix timestamp

  @Column('bigint')
  closeTime: number; // Unix timestamp khi lệnh đóng

  @Column('int')
  duration: number; // Thời gian của lệnh (giây) - ví dụ: 60, 300, 900

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  profitAmount: number; // Số tiền lời/lỗ

  @Column('int', { default: 0 })
  profitPercentage: number; // % lợi nhuận khi mở lệnh

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Asset, (asset) => asset.orders)
  @JoinColumn({ name: 'assetId' })
  asset: Asset;
}