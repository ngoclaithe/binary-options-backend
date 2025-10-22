import { Wallet } from '../../wallet/entities/wallet.entity';
import { Order } from '../../trading/entities/order.entity';
export declare enum UserRole {
    USER = "user",
    ADMIN = "admin"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    BANNED = "banned"
}
export declare class User {
    id: string;
    email: string;
    username: string;
    password: string;
    fullName: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    avatarUrl: string;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
    wallet: Wallet;
    orders: Order[];
}
