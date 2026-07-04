import notifee from "@notifee/react-native";
import { NotificationRepository } from "../database/repositories/notificationRepository";

export async function reconcileNotifications(
  notificationRepo: NotificationRepository
): Promise<void> {
  const scheduledIds = await notifee.getTriggerNotificationIds();
  const scheduledSet = new Set(scheduledIds);

  const storedMappings = await notificationRepo.getAll();
  for (const mapping of storedMappings) {
    if (!scheduledSet.has(mapping.notificationId)) {
      await notificationRepo.remove(mapping.id);
    }
  }
}

export async function getActiveNotificationCount(
  notificationRepo: NotificationRepository
): Promise<number> {
  const mappings = await notificationRepo.getAll();
  return mappings.length;
}
