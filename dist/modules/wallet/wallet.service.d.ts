import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';
export declare class WalletService {
    private readonly walletRepository;
    private readonly transactionRepository;
    private dataSource;
    constructor(walletRepository: Repository<Wallet>, transactionRepository: Repository<Transaction>, dataSource: DataSource);
    create(userId: string): Promise<Wallet>;
    findByUserId(userId: string): Promise<Wallet>;
    getBalance(userId: string): Promise<{
        balance: number;
        lockedBalance: number;
        availableBalance: number;
    }>;
    deposit(userId: string, amount: number, description?: string): Promise<Transaction>;
    withdraw(userId: string, amount: number, description?: string): Promise<Transaction>;
    lockBalance(userId: string, amount: number): Promise<void>;
    unlockBalance(userId: string, amount: number): Promise<void>;
    processTradeWin(userId: string, investAmount: number, profitAmount: number, orderId: string): Promise<Transaction>;
    processTradeLoss(userId: string, lossAmount: number, orderId: string): Promise<Transaction>;
    getTransactionHistory(userId: string, limit?: number): Promise<Transaction[]>;
}
