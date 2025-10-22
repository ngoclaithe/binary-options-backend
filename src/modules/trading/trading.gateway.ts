import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Order } from './entities/order.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/trading',
})
export class TradingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TradingGateway.name);

  afterInit(server: Server) {
    this.logger.log('Trading WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Notify user about order status change
   */
  notifyOrderUpdate(userId: string, order: Order) {
    this.server.to(`user:${userId}`).emit('order-update', order);
  }

  /**
   * Notify user about order closed
   */
  notifyOrderClosed(userId: string, order: Order) {
    this.server.to(`user:${userId}`).emit('order-closed', order);
  }

  /**
   * Broadcast to all users
   */
  broadcastMessage(event: string, data: any) {
    this.server.emit(event, data);
  }
}