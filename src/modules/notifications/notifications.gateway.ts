import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { NotificationsService, Notification } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(private readonly notificationsService: NotificationsService) {}

  afterInit(server: Server) {
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Extract userId from handshake (you should implement proper auth)
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove from userSockets
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('get-notifications')
  handleGetNotifications(client: Socket, payload: { unreadOnly?: boolean }) {
    const userId = this.getUserIdBySocketId(client.id);
    if (!userId) return;

    const notifications = this.notificationsService.getUserNotifications(
      userId,
      payload.unreadOnly,
    );

    return { notifications };
  }

  @SubscribeMessage('mark-read')
  handleMarkRead(client: Socket, payload: { notificationId: string }) {
    const userId = this.getUserIdBySocketId(client.id);
    if (!userId) return;

    this.notificationsService.markAsRead(userId, payload.notificationId);
    return { success: true };
  }

  @SubscribeMessage('mark-all-read')
  handleMarkAllRead(client: Socket) {
    const userId = this.getUserIdBySocketId(client.id);
    if (!userId) return;

    this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId: string, notification: Notification) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Broadcast notification to all users
   */
  broadcast(notification: Notification) {
    this.server.emit('notification', notification);
  }

  /**
   * Get userId by socketId
   */
  private getUserIdBySocketId(socketId: string): string | undefined {
    for (const [userId, sid] of this.userSockets.entries()) {
      if (sid === socketId) {
        return userId;
      }
    }
    return undefined;
  }
}