import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService, Notification } from './notifications.service';
export declare class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly notificationsService;
    server: Server;
    private readonly logger;
    private userSockets;
    constructor(notificationsService: NotificationsService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleGetNotifications(client: Socket, payload: {
        unreadOnly?: boolean;
    }): {
        notifications: Notification[];
    } | undefined;
    handleMarkRead(client: Socket, payload: {
        notificationId: string;
    }): {
        success: boolean;
    } | undefined;
    handleMarkAllRead(client: Socket): {
        success: boolean;
    } | undefined;
    sendToUser(userId: string, notification: Notification): void;
    broadcast(notification: Notification): void;
    private getUserIdBySocketId;
}
