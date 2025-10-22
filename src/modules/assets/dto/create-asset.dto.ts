import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { AssetType } from '../entities/asset.entity';

export class CreateAssetDto {
  @IsString()
  symbol: string;

  @IsString()
  name: string;

  @IsEnum(AssetType)
  type: AssetType;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  minTradeAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTradeAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  profitPercentage?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  apiSymbol?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}