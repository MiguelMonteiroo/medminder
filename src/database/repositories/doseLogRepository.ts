import type { SQLiteDatabase } from "expo-sqlite";
import { DoseLog } from "../../types/domain";

function rowToDoseLog(row: any): DoseLog {
  return {
    id: row.id,
    doseOccurrenceId: row.dose_occurrence_id,
    medicationId: row.medication_id,
    scheduleId: row.schedule_id,
    action: row.action,
    actionAt: row.action_at,
    snoozedUntil: row.snoozed_until || "",
  };
}

export function createDoseLogRepository(db: SQLiteDatabase) {
  async function getAll(): Promise<DoseLog[]> {
    const rows = await db.getAllAsync(
      "SELECT * FROM dose_logs ORDER BY action_at DESC"
    );
    return rows.map(rowToDoseLog);
  }

  async function getByMedicationId(
    medicationId: string
  ): Promise<DoseLog[]> {
    const rows = await db.getAllAsync(
      "SELECT * FROM dose_logs WHERE medication_id = ? ORDER BY action_at DESC",
      medicationId
    );
    return rows.map(rowToDoseLog);
  }

  async function getByDate(date: string): Promise<DoseLog[]> {
    const rows = await db.getAllAsync(
      "SELECT * FROM dose_logs WHERE action_at >= ? AND action_at < ? ORDER BY action_at ASC",
      `${date}T00:00:00`,
      `${date}T23:59:59`
    );
    return rows.map(rowToDoseLog);
  }

  async function create(log: DoseLog): Promise<void> {
    await db.runAsync(
      `INSERT INTO dose_logs (id, dose_occurrence_id, medication_id, schedule_id, action, action_at, snoozed_until)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      log.id,
      log.doseOccurrenceId,
      log.medicationId,
      log.scheduleId,
      log.action,
      log.actionAt,
      log.snoozedUntil || ""
    );
  }

  async function remove(id: string): Promise<void> {
    await db.runAsync("DELETE FROM dose_logs WHERE id = ?", id);
  }

  return { getAll, getByMedicationId, getByDate, create, remove };
}

export type DoseLogRepository = ReturnType<typeof createDoseLogRepository>;
