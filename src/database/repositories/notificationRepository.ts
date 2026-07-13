import type { NativeDB } from "../nativeDb";
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

export function createNotificationRepository(db: NativeDB) {
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

  async function getByDoseOccurrenceId(
    doseOccurrenceId: string
  ): Promise<ReminderNotification | null> {
    const rows = await db.getAllAsync(
      "SELECT * FROM notification_mappings WHERE dose_occurrence_id = ?",
      doseOccurrenceId
    );
    return rows.length > 0 ? rowToNotification(rows[0]) : null;
  }

  async function removeByDoseOccurrenceId(
    doseOccurrenceId: string
  ): Promise<void> {
    await db.runAsync(
      "DELETE FROM notification_mappings WHERE dose_occurrence_id = ?",
      doseOccurrenceId
    );
  }

  async function update(
    notification: ReminderNotification
  ): Promise<void> {
    await db.runAsync(
      `UPDATE notification_mappings SET notification_id = ?, scheduled_for = ? WHERE id = ?`,
      notification.notificationId,
      notification.scheduledFor,
      notification.id
    );
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

  async function removeAll(): Promise<void> {
    await db.runAsync("DELETE FROM notification_mappings");
  }

  return {
    getAll,
    getByMedicationId,
    getByDoseOccurrenceId,
    removeByDoseOccurrenceId,
    create,
    remove,
    update,
    removeByMedicationId,
    removeAll,
  };
}

export type NotificationRepository = ReturnType<
  typeof createNotificationRepository
>;
