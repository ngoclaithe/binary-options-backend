import { Order } from '../../trading/entities/order.entity';
export declare enum AssetType {
    CRYPTO = "crypto",
    FOREX = "forex",
    STOCK = "stock",
    COMMODITY = "commodity"
}
export declare enum AssetStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    MAINTENANCE = "maintenance"
}
export declare class Asset {
    id: string;
    symbol: string;
    name: string;
    type: AssetType;
    status: AssetStatus;
    icon: string;
    description: string;
    minTradeAmount: number;
    maxTradeAmount: number;
    profitPercentage: number;
    isAvailable: boolean;
    apiSymbol: string;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
    orders: Order[];
}
