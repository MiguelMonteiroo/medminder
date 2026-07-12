import notifee from "@notifee/react-native";
import { NotificationRepository } from "../database/repositories/notificationRepository";
import { MedicationRepository } from "../database/repositories/medicationRepository";
import { ScheduleRepository } from "../database/repositories/scheduleRepository";
import { generateDoseOccurrencesForDate } from "../utils/doseEngine";
import { ReminderScheduler } from "./reminderScheduler";
import { getNotificationPermissionStatus } from "./notificationPermissionService";

function formatDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function reconcileNotifications(
  notificationRepo: NotificationRepository,
  medicationRepo: MedicationRepository,
  scheduleRepo: ScheduleRepository,
  reminderScheduler: ReminderScheduler
): Promise<{ removed: number; recreated: number }> {
  const { granted } = await getNotificationPermissionStatus();

  const scheduledIds = await notifee.getTriggerNotificationIds();
  const scheduledSet = new Set(scheduledIds);

  const storedMappings = await notificationRepo.getAll();
  let removed = 0;
  const stale: typeof storedMappings = [];

  for (const mapping of storedMappings) {
    if (!scheduledSet.has(mapping.notificationId)) {
      stale.push(mapping);
      await notificationRepo.remove(mapping.id);
      removed++;
    }
  }

  let recreated = 0;

  if (!granted) {
    return { removed, recreated };
  }

  const remainingMappings = await notificationRepo.getAll();
  const existingDoseOccurrenceIds = new Set(
    remainingMappings.map((m) => m.doseOccurrenceId)
  );

  const medications = await medicationRepo.getAll();
  const schedules = await scheduleRepo.getAll();
  const now = Date.now();

  for (const medication of medications) {
    if (medication.isPaused) continue;

    const medSchedules = schedules.filter(
      (s) => s.medicationId === medication.id && s.isActive
    );

    for (const schedule of medSchedules) {
      const start = new Date();
      const nextOccurrences = Array.from({ length: 14 }, (_, index) =>
        generateDoseOccurrencesForDate(
          medication,
          schedule,
          formatDateString(addDays(start, index))
        )
      )
        .flat()
        .filter(
          (occurrence) =>
            new Date(occurrence.scheduledAt).getTime() > now &&
            !existingDoseOccurrenceIds.has(occurrence.id)
        );

      for (const occurrence of nextOccurrences) {
        const savedNotificationId = await reminderScheduler.scheduleForOccurrence(
          occurrence,
          medication,
          schedule
        );
        if (savedNotificationId) {
          recreated++;
        }
      }
    }
  }

  return { removed, recreated };
}

export async function getActiveNotificationCount(
  notificationRepo: NotificationRepository
): Promise<number> {
  const mappings = await notificationRepo.getAll();
  return mappings.length;
}
