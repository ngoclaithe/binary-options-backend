import { Wallet } from './wallet.entity';
export declare enum TransactionType {
    DEPOSIT = "deposit",
    WITHDRAW = "withdraw",
    TRADE_WIN = "trade_win",
    TRADE_LOSS = "trade_loss",
    TRADE_OPEN = "trade_open",
    TRADE_REFUND = "trade_refund"
}
export declare enum TransactionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare class Transaction {
    id: string;
    walletId: string;
    type: TransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    status: TransactionStatus;
    description: string;
    referenceId: string;
    metadata: any;
    createdAt: Date;
    wallet: Wallet;
}
