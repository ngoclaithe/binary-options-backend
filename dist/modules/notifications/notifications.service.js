"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    logger = new common_1.Logger(NotificationsService_1.name);
    notifications = new Map();
    createNotification(userId, type, title, message, data) {
        const notification = {
            id: this.generateId(),
            userId,
            type,
            title,
            message,
            data,
            createdAt: new Date(),
            read: false,
        };
        let userNotifications = this.notifications.get(userId) ?? [];
        userNotifications.push(notification);
        if (userNotifications.length > 100) {
            userNotifications = userNotifications.slice(-100);
        }
        this.notifications.set(userId, userNotifications);
        this.logger.debug(`Created notification for user ${userId}: ${title}`);
        return notification;
    }
    getUserNotifications(userId, unreadOnly = false) {
        const notifications = this.notifications.get(userId) || [];
        if (unreadOnly) {
            return notifications.filter((n) => !n.read);
        }
        return notifications;
    }
    markAsRead(userId, notificationId) {
        const notifications = this.notifications.get(userId);
        if (!notifications)
            return;
        const notification = notifications.find((n) => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
    }
    markAllAsRead(userId) {
        const notifications = this.notifications.get(userId);
        if (!notifications)
            return;
        notifications.forEach((n) => (n.read = true));
    }
    deleteNotification(userId, notificationId) {
        const notifications = this.notifications.get(userId);
        if (!notifications)
            return;
        const index = notifications.findIndex((n) => n.id === notificationId);
        if (index !== -1) {
            notifications.splice(index, 1);
        }
    }
    clearAll(userId) {
        this.notifications.delete(userId);
    }
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    notifyOrderCreated(userId, orderData) {
        return this.createNotification(userId, 'info', 'Order Created', `Your ${orderData.direction} order for ${orderData.asset} has been placed`, orderData);
    }
    notifyOrderWon(userId, orderData) {
        return this.createNotification(userId, 'success', 'Order Won! 🎉', `Congratulations! You won $${orderData.profitAmount.toFixed(2)}`, orderData);
    }
    notifyOrderLost(userId, orderData) {
        return this.createNotification(userId, 'error', 'Order Lost', `Your order resulted in a loss of $${Math.abs(orderData.profitAmount).toFixed(2)}`, orderData);
    }
    notifyDeposit(userId, amount) {
        return this.createNotification(userId, 'success', 'Deposit Successful', `$${amount.toFixed(2)} has been added to your wallet`, { amount });
    }
    notifyWithdraw(userId, amount) {
        return this.createNotification(userId, 'info', 'Withdrawal Processed', `$${amount.toFixed(2)} has been withdrawn from your wallet`, { amount });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map