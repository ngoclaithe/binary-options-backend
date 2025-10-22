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
export declare class NotificationsService {
    private readonly logger;
    private notifications;
    createNotification(userId: string, type: Notification['type'], title: string, message: string, data?: any): Notification;
    getUserNotifications(userId: string, unreadOnly?: boolean): Notification[];
    markAsRead(userId: string, notificationId: string): void;
    markAllAsRead(userId: string): void;
    deleteNotification(userId: string, notificationId: string): void;
    clearAll(userId: string): void;
    private generateId;
    notifyOrderCreated(userId: string, orderData: any): Notification;
    notifyOrderWon(userId: string, orderData: any): Notification;
    notifyOrderLost(userId: string, orderData: any): Notification;
    notifyDeposit(userId: string, amount: number): Notification;
    notifyWithdraw(userId: string, amount: number): Notification;
}
