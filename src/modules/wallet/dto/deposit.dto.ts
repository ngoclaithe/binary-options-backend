import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @Min(1, { message: 'Minimum deposit amount is $1' })
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}