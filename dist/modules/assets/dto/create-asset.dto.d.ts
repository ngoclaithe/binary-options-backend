import { AssetType } from '../entities/asset.entity';
export declare class CreateAssetDto {
    symbol: string;
    name: string;
    type: AssetType;
    icon?: string;
    description?: string;
    minTradeAmount?: number;
    maxTradeAmount?: number;
    profitPercentage?: number;
    isAvailable?: boolean;
    apiSymbol?: string;
    displayOrder?: number;
}
