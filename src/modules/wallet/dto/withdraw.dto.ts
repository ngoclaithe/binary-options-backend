import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class WithdrawDto {
  @IsNumber()
  @Min(1, { message: 'Minimum withdraw amount is $1' })
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}