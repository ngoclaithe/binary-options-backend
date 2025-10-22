import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Order } from './entities/order.entity';
export declare class TradingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    notifyOrderUpdate(userId: string, order: Order): void;
    notifyOrderClosed(userId: string, order: Order): void;
    broadcastMessage(event: string, data: any): void;
}
