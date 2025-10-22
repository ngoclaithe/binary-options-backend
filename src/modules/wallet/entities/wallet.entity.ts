import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from './transaction.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  lockedBalance: number; // Số tiền đang trong lệnh

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalDeposit: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalWithdraw: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalProfit: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalLoss: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];

  // Computed property
  get availableBalance(): number {
    return Number(this.balance) - Number(this.lockedBalance);
  }
}