import notifee, { TriggerType, AlarmType } from "@notifee/react-native";
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

    const notificationId = await notifee.createTriggerNotification(
      {
        title: "Hora do Medicamento",
        body: `Tome ${medication.name} ${medication.dosage ? `- ${medication.dosage}` : ""}`,
        data: {
          doseOccurrenceId: occurrence.id,
          medicationId: medication.id,
          scheduleId: schedule.id,
        },
        android: {
          channelId: "medication-reminders",
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        alarmManager: {
          type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
        },
      }
    );

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

  async function cancelSingle(occurrenceId: string): Promise<void> {
    const mapping = await notificationRepo.getByDoseOccurrenceId(occurrenceId);
    if (!mapping) return;
    await notifee.cancelTriggerNotification(mapping.notificationId);
    await notificationRepo.removeByDoseOccurrenceId(occurrenceId);
  }

  async function cancelForMedication(medicationId: string): Promise<void> {
    const mappings = await notificationRepo.getByMedicationId(medicationId);
    for (const mapping of mappings) {
      await notifee.cancelTriggerNotification(mapping.notificationId);
    }
    await notificationRepo.removeByMedicationId(medicationId);
  }

  async function cancelAll(): Promise<void> {
    await notifee.cancelAllNotifications();
    await notificationRepo.removeAll();
  }

  return { scheduleForOccurrence, cancelSingle, cancelForMedication, cancelAll };
}

export type ReminderScheduler = ReturnType<typeof createReminderScheduler>;
