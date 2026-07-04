import * as Notifications from "expo-notifications";
import { Medication, MedicationSchedule, DoseOccurrence } from "../types/domain";
import { NotificationRepository } from "../database/repositories/notificationRepository";

export function createReminderScheduler(
  notificationRepo: NotificationRepository
) {
  async function scheduleForOccurrence(
    occurrence: DoseOccurrence,
    medication: Medication,
    schedule: MedicationSchedule
  ): Promise<string> {
    const triggerDate = new Date(occurrence.scheduledAt);

    if (isNaN(triggerDate.getTime())) return "";

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hora do Medicamento",
        body: `Tome ${medication.name} ${medication.dosage ? `- ${medication.dosage}` : ""}`,
        data: {
          doseOccurrenceId: occurrence.id,
          medicationId: medication.id,
          scheduleId: schedule.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    const mappingId = `notif-${occurrence.id}`;
    await notificationRepo.create({
      id: mappingId,
      medicationId: medication.id,
      scheduleId: schedule.id,
      doseOccurrenceId: occurrence.id,
      notificationId,
      scheduledFor: occurrence.scheduledAt,
    });

    return notificationId;
  }

  async function cancelForMedication(medicationId: string): Promise<void> {
    const mappings = await notificationRepo.getByMedicationId(medicationId);
    for (const mapping of mappings) {
      await Notifications.cancelScheduledNotificationAsync(
        mapping.notificationId
      );
    }
    await notificationRepo.removeByMedicationId(medicationId);
  }

  async function cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  return { scheduleForOccurrence, cancelForMedication, cancelAll };
}

export type ReminderScheduler = ReturnType<typeof createReminderScheduler>;
