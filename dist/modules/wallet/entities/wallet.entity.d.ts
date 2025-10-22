import { User } from '../../users/entities/user.entity';
import { Transaction } from './transaction.entity';
export declare class Wallet {
    id: string;
    userId: string;
    balance: number;
    lockedBalance: number;
    totalDeposit: number;
    totalWithdraw: number;
    totalProfit: number;
    totalLoss: number;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    transactions: Transaction[];
    get availableBalance(): number;
}
