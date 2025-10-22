import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Request() req) {
    return await this.walletService.getBalance(req.user.userId);
  }

  @Get()
  async getWallet(@Request() req) {
    return await this.walletService.findByUserId(req.user.userId);
  }

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  async deposit(@Request() req, @Body() depositDto: DepositDto) {
    return await this.walletService.deposit(
      req.user.userId,
      depositDto.amount,
      depositDto.description,
    );
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.OK)
  async withdraw(@Request() req, @Body() withdrawDto: WithdrawDto) {
    return await this.walletService.withdraw(
      req.user.userId,
      withdrawDto.amount,
      withdrawDto.description,
    );
  }

  @Get('transactions')
  async getTransactions(
    @Request() req,
    @Query('limit') limit: number = 50,
  ) {
    return await this.walletService.getTransactionHistory(
      req.user.userId,
      limit,
    );
  }
}