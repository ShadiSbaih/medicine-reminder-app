import {
    getReadNotificationIds,
    markNotificationAsRead,
    markNotificationsAsRead,
} from "@/utils/storage";

class NotificationReadService {
  async list(dateKey: string): Promise<string[]> {
    return getReadNotificationIds(dateKey);
  }

  async markAsRead(dateKey: string, notificationId: string): Promise<void> {
    await markNotificationAsRead(dateKey, notificationId);
  }

  async markManyAsRead(
    dateKey: string,
    notificationIds: string[],
  ): Promise<void> {
    if (notificationIds.length === 0) {
      return;
    }

    await markNotificationsAsRead(dateKey, notificationIds);
  }
}

export const notificationReadService = new NotificationReadService();
