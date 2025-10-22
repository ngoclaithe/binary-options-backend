import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from './entities/transaction.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  async create(userId: string): Promise<Wallet> {
    const wallet = this.walletRepository.create({
      userId,
      balance: 0,
      lockedBalance: 0,
    });
    return await this.walletRepository.save(wallet);
  }

  async findByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
      relations: ['transactions'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getBalance(userId: string): Promise<{
    balance: number;
    lockedBalance: number;
    availableBalance: number;
  }> {
    const wallet = await this.findByUserId(userId);
    return {
      balance: Number(wallet.balance),
      lockedBalance: Number(wallet.lockedBalance),
      availableBalance: wallet.availableBalance,
    };
  }

  async deposit(
    userId: string,
    amount: number,
    description?: string,
  ): Promise<Transaction> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const balanceBefore = Number(wallet.balance);
      wallet.balance = Number(wallet.balance) + amount;
      wallet.totalDeposit = Number(wallet.totalDeposit) + amount;

      await queryRunner.manager.save(wallet);

      const transaction = queryRunner.manager.create(Transaction, {
        walletId: wallet.id,
        type: TransactionType.DEPOSIT,
        amount,
        balanceBefore,
        balanceAfter: Number(wallet.balance),
        status: TransactionStatus.COMPLETED,
        description: description || 'Deposit',
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async withdraw(
    userId: string,
    amount: number,
    description?: string,
  ): Promise<Transaction> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (wallet.availableBalance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const balanceBefore = Number(wallet.balance);
      wallet.balance = Number(wallet.balance) - amount;
      wallet.totalWithdraw = Number(wallet.totalWithdraw) + amount;

      await queryRunner.manager.save(wallet);

      const transaction = queryRunner.manager.create(Transaction, {
        walletId: wallet.id,
        type: TransactionType.WITHDRAW,
        amount,
        balanceBefore,
        balanceAfter: Number(wallet.balance),
        status: TransactionStatus.COMPLETED,
        description: description || 'Withdraw',
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async lockBalance(userId: string, amount: number): Promise<void> {
    const wallet = await this.findByUserId(userId);

    if (wallet.availableBalance < amount) {
      throw new BadRequestException('Insufficient available balance');
    }

    wallet.lockedBalance = Number(wallet.lockedBalance) + amount;
    await this.walletRepository.save(wallet);
  }

  async unlockBalance(userId: string, amount: number): Promise<void> {
    const wallet = await this.findByUserId(userId);
    wallet.lockedBalance = Number(wallet.lockedBalance) - amount;
    await this.walletRepository.save(wallet);
  }

  async processTradeWin(
    userId: string,
    investAmount: number,
    profitAmount: number,
    orderId: string,
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const balanceBefore = Number(wallet.balance);
      const totalReturn = investAmount + profitAmount;

      wallet.balance = Number(wallet.balance) + totalReturn;
      wallet.lockedBalance = Number(wallet.lockedBalance) - investAmount;
      wallet.totalProfit = Number(wallet.totalProfit) + profitAmount;

      await queryRunner.manager.save(wallet);

      const transaction = queryRunner.manager.create(Transaction, {
        walletId: wallet.id,
        type: TransactionType.TRADE_WIN,
        amount: totalReturn,
        balanceBefore,
        balanceAfter: Number(wallet.balance),
        status: TransactionStatus.COMPLETED,
        description: `Trade win: +$${profitAmount.toFixed(2)} profit`,
        referenceId: orderId,
        metadata: { investAmount, profitAmount },
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async processTradeLoss(
    userId: string,
    lossAmount: number,
    orderId: string,
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const balanceBefore = Number(wallet.balance);

      wallet.lockedBalance = Number(wallet.lockedBalance) - lossAmount;
      wallet.totalLoss = Number(wallet.totalLoss) + lossAmount;

      await queryRunner.manager.save(wallet);

      const transaction = queryRunner.manager.create(Transaction, {
        walletId: wallet.id,
        type: TransactionType.TRADE_LOSS,
        amount: lossAmount,
        balanceBefore,
        balanceAfter: Number(wallet.balance),
        status: TransactionStatus.COMPLETED,
        description: `Trade loss: -$${lossAmount.toFixed(2)}`,
        referenceId: orderId,
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTransactionHistory(
    userId: string,
    limit: number = 50,
  ): Promise<Transaction[]> {
    const wallet = await this.findByUserId(userId);
    return await this.transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}