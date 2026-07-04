import type { SQLiteDatabase } from "expo-sqlite";

const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS medications (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        dosage TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_paused INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS medication_schedules (
        id TEXT PRIMARY KEY NOT NULL,
        medication_id TEXT NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('dailyTimes', 'intervalHours', 'weekdays')),
        times TEXT NOT NULL DEFAULT '[]',
        interval_hours REAL NOT NULL DEFAULT 0,
        weekdays TEXT NOT NULL DEFAULT '[]',
        start_date TEXT NOT NULL DEFAULT '',
        end_date TEXT NOT NULL DEFAULT '',
        snooze_minutes INTEGER NOT NULL DEFAULT 5,
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS dose_logs (
        id TEXT PRIMARY KEY NOT NULL,
        dose_occurrence_id TEXT NOT NULL,
        medication_id TEXT NOT NULL,
        schedule_id TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('taken', 'skipped', 'snoozed', 'undone')),
        action_at TEXT NOT NULL,
        snoozed_until TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES medication_schedules(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notification_mappings (
        id TEXT PRIMARY KEY NOT NULL,
        medication_id TEXT NOT NULL,
        schedule_id TEXT NOT NULL,
        dose_occurrence_id TEXT NOT NULL,
        notification_id TEXT NOT NULL,
        scheduled_for TEXT NOT NULL,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES medication_schedules(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    currentVersion = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
