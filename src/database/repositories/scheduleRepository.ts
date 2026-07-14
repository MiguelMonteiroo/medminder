import type { NativeDB } from "../nativeDb";
import { MedicationSchedule } from "../../types/domain";

function rowToSchedule(row: any): MedicationSchedule {
  return {
    id: row.id,
    medicationId: row.medication_id,
    kind: row.kind,
    times: JSON.parse(row.times || "[]"),
    intervalHours: row.interval_hours,
    weekdays: JSON.parse(row.weekdays || "[]"),
    startDate: row.start_date,
    endDate: row.end_date,
    anchorAt: row.anchor_at || "",
    snoozeMinutes: row.snooze_minutes,
    isActive: row.is_active === 1,
  };
}

export function createScheduleRepository(db: NativeDB) {
  async function getByMedicationId(
    medicationId: string
  ): Promise<MedicationSchedule[]> {
    const rows = await db.getAllAsync(
      `SELECT * FROM medication_schedules
       WHERE medication_id = ?
       ORDER BY is_active DESC, id`,
      medicationId
    );
    return rows.map(rowToSchedule);
  }

  async function getAll(): Promise<MedicationSchedule[]> {
    const rows = await db.getAllAsync(
      `SELECT * FROM medication_schedules
       ORDER BY medication_id, is_active DESC, id`
    );
    return rows.map(rowToSchedule);
  }

  async function getById(id: string): Promise<MedicationSchedule | null> {
    const row = await db.getFirstAsync(
      "SELECT * FROM medication_schedules WHERE id = ?",
      id
    );
    return row ? rowToSchedule(row) : null;
  }

  async function create(schedule: MedicationSchedule): Promise<void> {
    await db.runAsync(
      `INSERT INTO medication_schedules (id, medication_id, kind, times, interval_hours, weekdays, start_date, end_date, anchor_at, snooze_minutes, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      schedule.id,
      schedule.medicationId,
      schedule.kind,
      JSON.stringify(schedule.times),
      schedule.intervalHours,
      JSON.stringify(schedule.weekdays),
      schedule.startDate,
      schedule.endDate,
      schedule.anchorAt,
      schedule.snoozeMinutes,
      schedule.isActive ? 1 : 0
    );
  }

  async function update(schedule: MedicationSchedule): Promise<void> {
    await db.runAsync(
      `UPDATE medication_schedules SET kind = ?, times = ?, interval_hours = ?, weekdays = ?, start_date = ?, end_date = ?, anchor_at = ?, snooze_minutes = ?, is_active = ?
       WHERE id = ?`,
      schedule.kind,
      JSON.stringify(schedule.times),
      schedule.intervalHours,
      JSON.stringify(schedule.weekdays),
      schedule.startDate,
      schedule.endDate,
      schedule.anchorAt,
      schedule.snoozeMinutes,
      schedule.isActive ? 1 : 0,
      schedule.id
    );
  }

  async function remove(id: string): Promise<void> {
    await db.runAsync(
      "DELETE FROM medication_schedules WHERE id = ?",
      id
    );
  }

  async function removeByMedicationId(medicationId: string): Promise<void> {
    await db.runAsync(
      "DELETE FROM medication_schedules WHERE medication_id = ?",
      medicationId
    );
  }

  async function deactivateOthers(
    medicationId: string,
    activeScheduleId: string
  ): Promise<void> {
    await db.runAsync(
      `UPDATE medication_schedules
       SET is_active = 0
       WHERE medication_id = ? AND id <> ? AND is_active = 1`,
      medicationId,
      activeScheduleId
    );
  }

  return {
    getByMedicationId,
    getAll,
    getById,
    create,
    update,
    remove,
    removeByMedicationId,
    deactivateOthers,
  };
}

export type ScheduleRepository = ReturnType<typeof createScheduleRepository>;
