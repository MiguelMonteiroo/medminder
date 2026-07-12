import type { NativeDB } from "../nativeDb";
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
    commandId: row.command_id || "",
  };
}

export function createDoseLogRepository(db: NativeDB) {
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

  async function create(log: DoseLog): Promise<boolean> {
    const result = await db.runAsync(
      `INSERT OR IGNORE INTO dose_logs (id, dose_occurrence_id, medication_id, schedule_id, action, action_at, snoozed_until, command_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      log.id,
      log.doseOccurrenceId,
      log.medicationId,
      log.scheduleId,
      log.action,
      log.actionAt,
      log.snoozedUntil || "",
      log.commandId || ""
    );
    return result.changes > 0;
  }

  async function getByDoseOccurrenceId(
    doseOccurrenceId: string
  ): Promise<DoseLog[]> {
    const rows = await db.getAllAsync(
      "SELECT * FROM dose_logs WHERE dose_occurrence_id = ? ORDER BY action_at ASC",
      doseOccurrenceId
    );
    return rows.map(rowToDoseLog);
  }

  async function countSnoozes(doseOccurrenceId: string): Promise<number> {
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM dose_logs WHERE dose_occurrence_id = ? AND action = 'snoozed'",
      doseOccurrenceId
    );
    return row?.count ?? 0;
  }

  async function remove(id: string): Promise<void> {
    await db.runAsync("DELETE FROM dose_logs WHERE id = ?", id);
  }

  return {
    getAll,
    getByMedicationId,
    getByDoseOccurrenceId,
    getByDate,
    countSnoozes,
    create,
    remove,
  };
}

export type DoseLogRepository = ReturnType<typeof createDoseLogRepository>;
