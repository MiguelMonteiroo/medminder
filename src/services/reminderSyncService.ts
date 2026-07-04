import * as Notifications from "expo-notifications";
import { Medication, MedicationSchedule } from "../types/domain";
import { generateDoseOccurrencesForDate } from "../utils/doseEngine";
import { NotificationRepository } from "../database/repositories/notificationRepository";

export async function reconcileNotifications(
  medications: Medication[],
  schedules: MedicationSchedule[],
  notificationRepo: NotificationRepository
): Promise<void> {
  const scheduledNotifs = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledIds = new Set(scheduledNotifs.map((n) => n.identifier));

  const storedMappings = await notificationRepo.getAll();
  for (const mapping of storedMappings) {
    if (!scheduledIds.has(mapping.notificationId)) {
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
