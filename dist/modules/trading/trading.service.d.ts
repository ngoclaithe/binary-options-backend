import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Position } from './entities/position.entity';
import { WalletService } from '../wallet/wallet.service';
import { AssetsService } from '../assets/assets.service';
import { PriceFeedService } from '../price-feed/price-feed.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class TradingService {
    private readonly orderRepository;
    private readonly positionRepository;
    private readonly walletService;
    private readonly assetsService;
    private readonly priceFeedService;
    private dataSource;
    constructor(orderRepository: Repository<Order>, positionRepository: Repository<Position>, walletService: WalletService, assetsService: AssetsService, priceFeedService: PriceFeedService, dataSource: DataSource);
    createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<Order>;
    closeOrder(orderId: string): Promise<Order>;
    private updatePositionStats;
    getUserOrders(userId: string, status?: OrderStatus, limit?: number): Promise<Order[]>;
    getActiveOrders(userId: string): Promise<Order[]>;
    getPositionStats(userId: string): Promise<Position>;
    getOrderById(orderId: string, userId: string): Promise<Order>;
    cancelOrder(orderId: string, userId: string): Promise<Order>;
}
