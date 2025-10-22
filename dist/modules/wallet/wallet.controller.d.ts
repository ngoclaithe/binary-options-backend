import { WalletService } from './wallet.service';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getBalance(req: any): Promise<{
        balance: number;
        lockedBalance: number;
        availableBalance: number;
    }>;
    getWallet(req: any): Promise<import("./entities/wallet.entity").Wallet>;
    deposit(req: any, depositDto: DepositDto): Promise<import("./entities/transaction.entity").Transaction>;
    withdraw(req: any, withdrawDto: WithdrawDto): Promise<import("./entities/transaction.entity").Transaction>;
    getTransactions(req: any, limit?: number): Promise<import("./entities/transaction.entity").Transaction[]>;
}
