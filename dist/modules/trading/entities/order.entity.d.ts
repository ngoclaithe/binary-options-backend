import { User } from '../../users/entities/user.entity';
import { Asset } from '../../assets/entities/asset.entity';
export declare enum OrderDirection {
    UP = "up",
    DOWN = "down"
}
export declare enum OrderStatus {
    PENDING = "pending",
    ACTIVE = "active",
    WON = "won",
    LOST = "lost",
    DRAW = "draw",
    CANCELLED = "cancelled"
}
export declare class Order {
    id: string;
    userId: string;
    assetId: string;
    direction: OrderDirection;
    investAmount: number;
    openPrice: number;
    closePrice: number;
    openTime: number;
    closeTime: number;
    duration: number;
    status: OrderStatus;
    profitAmount: number;
    profitPercentage: number;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    asset: Asset;
}
