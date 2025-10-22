import { OrderDirection } from '../entities/order.entity';
export declare class CreateOrderDto {
    assetId: string;
    direction: OrderDirection;
    investAmount: number;
    duration: number;
}
