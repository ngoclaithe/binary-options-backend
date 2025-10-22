"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wallet_entity_1 = require("./entities/wallet.entity");
const transaction_entity_1 = require("./entities/transaction.entity");
let WalletService = class WalletService {
    walletRepository;
    transactionRepository;
    dataSource;
    constructor(walletRepository, transactionRepository, dataSource) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.dataSource = dataSource;
    }
    async create(userId) {
        const wallet = this.walletRepository.create({
            userId,
            balance: 0,
            lockedBalance: 0,
        });
        return await this.walletRepository.save(wallet);
    }
    async findByUserId(userId) {
        const wallet = await this.walletRepository.findOne({
            where: { userId },
            relations: ['transactions'],
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        return wallet;
    }
    async getBalance(userId) {
        const wallet = await this.findByUserId(userId);
        return {
            balance: Number(wallet.balance),
            lockedBalance: Number(wallet.lockedBalance),
            availableBalance: wallet.availableBalance,
        };
    }
    async deposit(userId, amount, description) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Amount must be greater than 0');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const wallet = await queryRunner.manager.findOne(wallet_entity_1.Wallet, {
                where: { userId },
            });
            if (!wallet) {
                throw new common_1.NotFoundException('Wallet not found');
            }
            const balanceBefore = Number(wallet.balance);
            wallet.balance = Number(wallet.balance) + amount;
            wallet.totalDeposit = Number(wallet.totalDeposit) + amount;
            await queryRunner.manager.save(wallet);
            const transaction = queryRunner.manager.create(transaction_entity_1.Transaction, {
                walletId: wallet.id,
                type: transaction_entity_1.TransactionType.DEPOSIT,
                amount,
                balanceBefore,
                balanceAfter: Number(wallet.balance),
                status: transaction_entity_1.TransactionStatus.COMPLETED,
                description: description || 'Deposit',
            });
            await queryRunner.manager.save(transaction);
            await queryRunner.commitTransaction();
            return transaction;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async withdraw(userId, amount, description) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Amount must be greater than 0');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const wallet = await queryRunner.manager.findOne(wallet_entity_1.Wallet, {
                where: { userId },
            });
            if (!wallet) {
                throw new common_1.NotFoundException('Wallet not found');
            }
            if (wallet.availableBalance < amount) {
                throw new common_1.BadRequestException('Insufficient balance');
            }
            const balanceBefore = Number(wallet.balance);
            wallet.balance = Number(wallet.balance) - amount;
            wallet.totalWithdraw = Number(wallet.totalWithdraw) + amount;
            await queryRunner.manager.save(wallet);
            const transaction = queryRunner.manager.create(transaction_entity_1.Transaction, {
                walletId: wallet.id,
                type: transaction_entity_1.TransactionType.WITHDRAW,
                amount,
                balanceBefore,
                balanceAfter: Number(wallet.balance),
                status: transaction_entity_1.TransactionStatus.COMPLETED,
                description: description || 'Withdraw',
            });
            await queryRunner.manager.save(transaction);
            await queryRunner.commitTransaction();
            return transaction;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async lockBalance(userId, amount) {
        const wallet = await this.findByUserId(userId);
        if (wallet.availableBalance < amount) {
            throw new common_1.BadRequestException('Insufficient available balance');
        }
        wallet.lockedBalance = Number(wallet.lockedBalance) + amount;
        await this.walletRepository.save(wallet);
    }
    async unlockBalance(userId, amount) {
        const wallet = await this.findByUserId(userId);
        wallet.lockedBalance = Number(wallet.lockedBalance) - amount;
        await this.walletRepository.save(wallet);
    }
    async processTradeWin(userId, investAmount, profitAmount, orderId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const wallet = await queryRunner.manager.findOne(wallet_entity_1.Wallet, {
                where: { userId },
            });
            if (!wallet) {
                throw new common_1.NotFoundException('Wallet not found');
            }
            const balanceBefore = Number(wallet.balance);
            const totalReturn = investAmount + profitAmount;
            wallet.balance = Number(wallet.balance) + totalReturn;
            wallet.lockedBalance = Number(wallet.lockedBalance) - investAmount;
            wallet.totalProfit = Number(wallet.totalProfit) + profitAmount;
            await queryRunner.manager.save(wallet);
            const transaction = queryRunner.manager.create(transaction_entity_1.Transaction, {
                walletId: wallet.id,
                type: transaction_entity_1.TransactionType.TRADE_WIN,
                amount: totalReturn,
                balanceBefore,
                balanceAfter: Number(wallet.balance),
                status: transaction_entity_1.TransactionStatus.COMPLETED,
                description: `Trade win: +$${profitAmount.toFixed(2)} profit`,
                referenceId: orderId,
                metadata: { investAmount, profitAmount },
            });
            await queryRunner.manager.save(transaction);
            await queryRunner.commitTransaction();
            return transaction;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async processTradeLoss(userId, lossAmount, orderId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const wallet = await queryRunner.manager.findOne(wallet_entity_1.Wallet, {
                where: { userId },
            });
            if (!wallet) {
                throw new common_1.NotFoundException('Wallet not found');
            }
            const balanceBefore = Number(wallet.balance);
            wallet.lockedBalance = Number(wallet.lockedBalance) - lossAmount;
            wallet.totalLoss = Number(wallet.totalLoss) + lossAmount;
            await queryRunner.manager.save(wallet);
            const transaction = queryRunner.manager.create(transaction_entity_1.Transaction, {
                walletId: wallet.id,
                type: transaction_entity_1.TransactionType.TRADE_LOSS,
                amount: lossAmount,
                balanceBefore,
                balanceAfter: Number(wallet.balance),
                status: transaction_entity_1.TransactionStatus.COMPLETED,
                description: `Trade loss: -$${lossAmount.toFixed(2)}`,
                referenceId: orderId,
            });
            await queryRunner.manager.save(transaction);
            await queryRunner.commitTransaction();
            return transaction;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getTransactionHistory(userId, limit = 50) {
        const wallet = await this.findByUserId(userId);
        return await this.transactionRepository.find({
            where: { walletId: wallet.id },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], WalletService);
//# sourceMappingURL=wallet.service.js.map