import type { NativeDB } from "../nativeDb";
import type { ReminderArtifact } from "../../types/domain";

function rowToArtifact(row: any): ReminderArtifact {
  return {
    id: row.id,
    kind: row.kind,
    notificationId: row.notification_id,
    doseOccurrenceId: row.dose_occurrence_id,
    medicationId: row.medication_id,
    scheduleId: row.schedule_id,
    doseWindowKey: row.dose_window_key,
    scheduledFor: row.scheduled_for,
    expiresAt: row.expires_at || "",
    createdAt: row.created_at,
  };
}

export function createReminderArtifactRepository(db: NativeDB) {
  async function getAll(): Promise<ReminderArtifact[]> {
    const rows = await db.getAllAsync(
      "SELECT * FROM reminder_artifacts ORDER BY scheduled_for ASC"
    );
    return rows.map(rowToArtifact);
  }

  async function getByDoseOccurrenceId(
    occurrenceId: string
  ): Promise<ReminderArtifact[]> {
    const rows = await db.getAllAsync(
      "SELECT * FROM reminder_artifacts WHERE dose_occurrence_id = ? ORDER BY scheduled_for ASC",
      occurrenceId
    );
    return rows.map(rowToArtifact);
  }

  async function getByMedicationId(
    medicationId: string
  ): Promise<ReminderArtifact[]> {
    const rows = await db.getAllAsync(
      "SELECT * FROM reminder_artifacts WHERE medication_id = ? ORDER BY scheduled_for ASC",
      medicationId
    );
    return rows.map(rowToArtifact);
  }

  async function getByWindowKey(windowKey: string): Promise<ReminderArtifact[]> {
    const rows = await db.getAllAsync(
      "SELECT * FROM reminder_artifacts WHERE dose_window_key = ? ORDER BY scheduled_for ASC",
      windowKey
    );
    return rows.map(rowToArtifact);
  }

  async function create(artifact: ReminderArtifact): Promise<void> {
    await db.runAsync(
      `INSERT OR REPLACE INTO reminder_artifacts
       (id, kind, notification_id, dose_occurrence_id, medication_id, schedule_id, dose_window_key, scheduled_for, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      artifact.id,
      artifact.kind,
      artifact.notificationId,
      artifact.doseOccurrenceId,
      artifact.medicationId,
      artifact.scheduleId,
      artifact.doseWindowKey,
      artifact.scheduledFor,
      artifact.expiresAt,
      artifact.createdAt
    );
  }

  async function remove(id: string): Promise<void> {
    await db.runAsync("DELETE FROM reminder_artifacts WHERE id = ?", id);
  }

  async function removeByDoseOccurrenceId(occurrenceId: string): Promise<void> {
    await db.runAsync(
      "DELETE FROM reminder_artifacts WHERE dose_occurrence_id = ?",
      occurrenceId
    );
  }

  async function removeByMedicationId(medicationId: string): Promise<void> {
    await db.runAsync(
      "DELETE FROM reminder_artifacts WHERE medication_id = ?",
      medicationId
    );
  }

  async function removeAll(): Promise<void> {
    await db.runAsync("DELETE FROM reminder_artifacts");
  }

  return {
    getAll,
    getByDoseOccurrenceId,
    getByMedicationId,
    getByWindowKey,
    create,
    remove,
    removeByDoseOccurrenceId,
    removeByMedicationId,
    removeAll,
  };
}

export type ReminderArtifactRepository = ReturnType<
  typeof createReminderArtifactRepository
>;
