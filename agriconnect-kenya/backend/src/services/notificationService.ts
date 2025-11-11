import { Notification } from '../models/Notification';
import { User } from '../models/User';

class NotificationService {
  async createNotification(userId: string, message: string) {
    const notification = new Notification({
      userId,
      message,
      read: false,
      createdAt: new Date(),
    });
    await notification.save();
    return notification;
  }

  async getUserNotifications(userId: string) {
    return await Notification.find({ userId }).sort({ createdAt: -1 });
  }

  async markAsRead(notificationId: string) {
    return await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
  }

  async deleteNotification(notificationId: string) {
    return await Notification.findByIdAndDelete(notificationId);
  }
}

export default new NotificationService();