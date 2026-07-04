import type { SQLiteDatabase } from "expo-sqlite";
import { ReminderNotification } from "../../types/domain";

function rowToNotification(row: any): ReminderNotification {
  return {
    id: row.id,
    medicationId: row.medication_id,
    scheduleId: row.schedule_id,
    doseOccurrenceId: row.dose_occurrence_id,
    notificationId: row.notification_id,
    scheduledFor: row.scheduled_for,
  };
}

export function createNotificationRepository(db: SQLiteDatabase) {
  async function getAll(): Promise<ReminderNotification[]> {
    const rows = await db.getAllAsync(
      "SELECT * FROM notification_mappings ORDER BY scheduled_for ASC"
    );
    return rows.map(rowToNotification);
  }

  async function getByMedicationId(
    medicationId: string
  ): Promise<ReminderNotification[]> {
    const rows = await db.getAllAsync(
      "SELECT * FROM notification_mappings WHERE medication_id = ?",
      medicationId
    );
    return rows.map(rowToNotification);
  }

  async function create(
    notification: ReminderNotification
  ): Promise<void> {
    await db.runAsync(
      `INSERT INTO notification_mappings (id, medication_id, schedule_id, dose_occurrence_id, notification_id, scheduled_for)
       VALUES (?, ?, ?, ?, ?, ?)`,
      notification.id,
      notification.medicationId,
      notification.scheduleId,
      notification.doseOccurrenceId,
      notification.notificationId,
      notification.scheduledFor
    );
  }

  async function remove(id: string): Promise<void> {
    await db.runAsync(
      "DELETE FROM notification_mappings WHERE id = ?",
      id
    );
  }

  async function removeByMedicationId(
    medicationId: string
  ): Promise<void> {
    await db.runAsync(
      "DELETE FROM notification_mappings WHERE medication_id = ?",
      medicationId
    );
  }

  return { getAll, getByMedicationId, create, remove, removeByMedicationId };
}

export type NotificationRepository = ReturnType<
  typeof createNotificationRepository
>;
