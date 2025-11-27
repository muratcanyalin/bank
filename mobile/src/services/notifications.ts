/**
 * Mock Notification Service
 * In production, this would integrate with:
 * - Firebase Cloud Messaging (FCM)
 * - Apple Push Notification Service (APNS)
 * - Expo Push Notifications
 */

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'TRANSFER' | 'TRANSACTION' | 'ACCOUNT' | 'SECURITY';
  timestamp: Date;
  read: boolean;
  data?: any;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  /**
   * Subscribe to notification updates
   */
  subscribe(callback: (notifications: Notification[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * Notify all subscribers
   */
  private notify() {
    this.listeners.forEach((listener) => listener([...this.notifications]));
  }

  /**
   * Add notification
   */
  add(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.notify();
    return newNotification;
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      this.notify();
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.notify();
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  /**
   * Delete notification
   */
  delete(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  /**
   * Clear all notifications
   */
  clear() {
    this.notifications = [];
    this.notify();
  }

  /**
   * Mock: Simulate transfer notification
   */
  simulateTransferNotification(amount: number, toAccount: string) {
    this.add({
      title: 'Transfer Tamamlandı',
      message: `${amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} tutarında transfer işlemi tamamlandı.`,
      type: 'TRANSFER',
      data: { amount, toAccount },
    });
  }

  /**
   * Mock: Simulate transaction notification
   */
  simulateTransactionNotification(type: string, amount: number) {
    this.add({
      title: 'Yeni İşlem',
      message: `${type} işlemi: ${amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`,
      type: 'TRANSACTION',
      data: { type, amount },
    });
  }

  /**
   * Mock: Simulate security notification
   */
  simulateSecurityNotification(message: string) {
    this.add({
      title: 'Güvenlik Uyarısı',
      message,
      type: 'SECURITY',
    });
  }
}

export const notificationService = new NotificationService();


