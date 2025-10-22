"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const notifications_service_1 = require("./notifications.service");
let NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
    notificationsService;
    server;
    logger = new common_1.Logger(NotificationsGateway_1.name);
    userSockets = new Map();
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    afterInit(server) {
        this.logger.log('Notifications WebSocket Gateway initialized');
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
        const userId = client.handshake.query.userId;
        if (userId) {
            this.userSockets.set(userId, client.id);
            client.join(`user:${userId}`);
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        for (const [userId, socketId] of this.userSockets.entries()) {
            if (socketId === client.id) {
                this.userSockets.delete(userId);
                break;
            }
        }
    }
    handleGetNotifications(client, payload) {
        const userId = this.getUserIdBySocketId(client.id);
        if (!userId)
            return;
        const notifications = this.notificationsService.getUserNotifications(userId, payload.unreadOnly);
        return { notifications };
    }
    handleMarkRead(client, payload) {
        const userId = this.getUserIdBySocketId(client.id);
        if (!userId)
            return;
        this.notificationsService.markAsRead(userId, payload.notificationId);
        return { success: true };
    }
    handleMarkAllRead(client) {
        const userId = this.getUserIdBySocketId(client.id);
        if (!userId)
            return;
        this.notificationsService.markAllAsRead(userId);
        return { success: true };
    }
    sendToUser(userId, notification) {
        this.server.to(`user:${userId}`).emit('notification', notification);
    }
    broadcast(notification) {
        this.server.emit('notification', notification);
    }
    getUserIdBySocketId(socketId) {
        for (const [userId, sid] of this.userSockets.entries()) {
            if (sid === socketId) {
                return userId;
            }
        }
        return undefined;
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('get-notifications'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleGetNotifications", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark-read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleMarkRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark-all-read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleMarkAllRead", null);
exports.NotificationsGateway = NotificationsGateway = NotificationsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/notifications',
    }),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map