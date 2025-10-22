import { IsEnum, IsNumber, IsUUID, Min, IsIn } from 'class-validator';
import { OrderDirection } from '../entities/order.entity';

export class CreateOrderDto {
  @IsUUID()
  assetId: string;

  @IsEnum(OrderDirection)
  direction: OrderDirection;

  @IsNumber()
  @Min(1)
  investAmount: number;

  @IsNumber()
  @IsIn([60, 120, 180, 300, 600, 900, 1800, 3600]) // 1m, 2m, 3m, 5m, 10m, 15m, 30m, 1h
  duration: number; // Duration in seconds
}