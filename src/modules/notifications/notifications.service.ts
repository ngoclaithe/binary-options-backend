import { Injectable, Logger } from '@nestjs/common';

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  createdAt: Date;
  read: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private notifications: Map<string, Notification[]> = new Map();

  /**
   * Create notification for user
   */
createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data?: any,
): Notification {
  const notification: Notification = {
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

  // Giữ lại tối đa 100 thông báo
  if (userNotifications.length > 100) {
    userNotifications = userNotifications.slice(-100);
  }

  this.notifications.set(userId, userNotifications);

  this.logger.debug(`Created notification for user ${userId}: ${title}`);

  return notification;
}


  /**
   * Get user notifications
   */
  getUserNotifications(userId: string, unreadOnly: boolean = false): Notification[] {
    const notifications = this.notifications.get(userId) || [];

    if (unreadOnly) {
      return notifications.filter((n) => !n.read);
    }

    return notifications;
  }

  /**
   * Mark notification as read
   */
  markAsRead(userId: string, notificationId: string): void {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string): void {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    notifications.forEach((n) => (n.read = true));
  }

  /**
   * Delete notification
   */
  deleteNotification(userId: string, notificationId: string): void {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    const index = notifications.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      notifications.splice(index, 1);
    }
  }

  /**
   * Clear all notifications for user
   */
  clearAll(userId: string): void {
    this.notifications.delete(userId);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Notification templates
  notifyOrderCreated(userId: string, orderData: any): Notification {
    return this.createNotification(
      userId,
      'info',
      'Order Created',
      `Your ${orderData.direction} order for ${orderData.asset} has been placed`,
      orderData,
    );
  }

  notifyOrderWon(userId: string, orderData: any): Notification {
    return this.createNotification(
      userId,
      'success',
      'Order Won! 🎉',
      `Congratulations! You won $${orderData.profitAmount.toFixed(2)}`,
      orderData,
    );
  }

  notifyOrderLost(userId: string, orderData: any): Notification {
    return this.createNotification(
      userId,
      'error',
      'Order Lost',
      `Your order resulted in a loss of $${Math.abs(orderData.profitAmount).toFixed(2)}`,
      orderData,
    );
  }

  notifyDeposit(userId: string, amount: number): Notification {
    return this.createNotification(
      userId,
      'success',
      'Deposit Successful',
      `$${amount.toFixed(2)} has been added to your wallet`,
      { amount },
    );
  }

  notifyWithdraw(userId: string, amount: number): Notification {
    return this.createNotification(
      userId,
      'info',
      'Withdrawal Processed',
      `$${amount.toFixed(2)} has been withdrawn from your wallet`,
      { amount },
    );
  }
}