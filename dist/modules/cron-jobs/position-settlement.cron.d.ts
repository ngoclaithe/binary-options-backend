import { Repository } from 'typeorm';
import { Order } from '../trading/entities/order.entity';
import { TradingService } from '../trading/trading.service';
import { TradingGateway } from '../trading/trading.gateway';
export declare class PositionSettlementCron {
    private readonly orderRepository;
    private readonly tradingService;
    private readonly tradingGateway;
    private readonly logger;
    private isRunning;
    constructor(orderRepository: Repository<Order>, tradingService: TradingService, tradingGateway: TradingGateway);
    settleExpiredOrders(): Promise<void>;
    cleanupOldData(): Promise<void>;
}
