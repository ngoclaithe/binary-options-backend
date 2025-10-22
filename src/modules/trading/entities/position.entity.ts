import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// Entity này để theo dõi tổng quan positions của user
@Entity('positions')
@Index(['userId'])
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('int', { default: 0 })
  totalTrades: number;

  @Column('int', { default: 0 })
  totalWins: number;

  @Column('int', { default: 0 })
  totalLosses: number;

  @Column('int', { default: 0 })
  totalDraws: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalInvested: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalProfit: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalLoss: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  winRate: number; // % thắng

  @Column('int', { default: 0 })
  currentStreak: number; // Chuỗi thắng/thua hiện tại (+ là thắng, - là thua)

  @Column('int', { default: 0 })
  bestStreak: number;

  @Column('int', { default: 0 })
  worstStreak: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}