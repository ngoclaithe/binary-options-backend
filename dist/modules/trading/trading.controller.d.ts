import { TradingService } from './trading.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './entities/order.entity';
export declare class TradingController {
    private readonly tradingService;
    constructor(tradingService: TradingService);
    createOrder(req: any, createOrderDto: CreateOrderDto): Promise<import("./entities/order.entity").Order>;
    getUserOrders(req: any, status?: OrderStatus, limit?: number): Promise<import("./entities/order.entity").Order[]>;
    getActiveOrders(req: any): Promise<import("./entities/order.entity").Order[]>;
    getOrderById(req: any, id: string): Promise<import("./entities/order.entity").Order>;
    cancelOrder(req: any, id: string): Promise<import("./entities/order.entity").Order>;
    getPositionStats(req: any): Promise<import("./entities/position.entity").Position>;
}
