import type { NativeDB } from "./nativeDb";

const DATABASE_VERSION = 3;

async function tableHasColumn(
  db: NativeDB,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const columns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${tableName})`
  );
  return columns.some((column) => column.name === columnName);
}

async function assertForeignKeyIntegrity(db: NativeDB): Promise<void> {
  const violations = await db.getAllAsync("PRAGMA foreign_key_check");
  if (violations.length > 0) {
    throw new Error("Database contains foreign-key violations");
  }
}

export async function migrateDbIfNeeded(db: NativeDB) {
  await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    PRAGMA foreign_keys = ON;
  `);

  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    await assertForeignKeyIntegrity(db);
    return;
  }

  await db.withTransactionAsync(async (transaction) => {
    if (currentVersion === 0) {
      await transaction.execAsync(`
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

    if (currentVersion === 1) {
      if (!(await tableHasColumn(transaction, "medication_schedules", "anchor_at"))) {
        await transaction.execAsync(
          "ALTER TABLE medication_schedules ADD COLUMN anchor_at TEXT NOT NULL DEFAULT ''"
        );
      }

      if (!(await tableHasColumn(transaction, "dose_logs", "command_id"))) {
        await transaction.execAsync(
          "ALTER TABLE dose_logs ADD COLUMN command_id TEXT NOT NULL DEFAULT ''"
        );
      }

      await transaction.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_dose_logs_command_id
      ON dose_logs(command_id) WHERE command_id <> '';

      CREATE TABLE IF NOT EXISTS reminder_artifacts (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL,
        notification_id TEXT NOT NULL,
        dose_occurrence_id TEXT NOT NULL,
        medication_id TEXT NOT NULL,
        schedule_id TEXT NOT NULL,
        dose_window_key TEXT NOT NULL,
        scheduled_for TEXT NOT NULL,
        expires_at TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES medication_schedules(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_reminder_artifacts_occurrence
      ON reminder_artifacts(dose_occurrence_id);
      CREATE INDEX IF NOT EXISTS idx_reminder_artifacts_medication
      ON reminder_artifacts(medication_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reminder_artifacts_notification
      ON reminder_artifacts(notification_id);
      CREATE INDEX IF NOT EXISTS idx_reminder_artifacts_scheduled
      ON reminder_artifacts(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_reminder_artifacts_window
      ON reminder_artifacts(dose_window_key);

      INSERT OR IGNORE INTO app_settings (key, value)
      VALUES ('defaultSnoozeMinutes', '5');
      `);

      currentVersion = 2;
    }

    if (currentVersion === 2) {
      await transaction.execAsync(`
        DELETE FROM reminder_artifacts
        WHERE medication_id NOT IN (SELECT id FROM medications)
           OR schedule_id NOT IN (SELECT id FROM medication_schedules);

        DELETE FROM notification_mappings
        WHERE medication_id NOT IN (SELECT id FROM medications)
           OR schedule_id NOT IN (SELECT id FROM medication_schedules);

        DELETE FROM dose_logs
        WHERE medication_id NOT IN (SELECT id FROM medications)
           OR schedule_id NOT IN (SELECT id FROM medication_schedules);

        DELETE FROM medication_schedules
        WHERE medication_id NOT IN (SELECT id FROM medications);

        UPDATE medication_schedules AS duplicate
        SET is_active = 0
        WHERE duplicate.is_active = 1
          AND EXISTS (
            SELECT 1
            FROM medication_schedules AS keeper
            WHERE keeper.medication_id = duplicate.medication_id
              AND keeper.is_active = 1
              AND keeper.rowid < duplicate.rowid
          );

        DELETE FROM reminder_artifacts
        WHERE rowid NOT IN (
          SELECT MIN(rowid)
          FROM reminder_artifacts
          GROUP BY dose_occurrence_id, kind, scheduled_for
        );

        DELETE FROM notification_mappings
        WHERE rowid NOT IN (
          SELECT MIN(rowid)
          FROM notification_mappings
          GROUP BY dose_occurrence_id
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_medication_schedules_one_active
        ON medication_schedules(medication_id) WHERE is_active = 1;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_reminder_artifacts_logical_key
        ON reminder_artifacts(dose_occurrence_id, kind, scheduled_for);

        CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_mappings_occurrence
        ON notification_mappings(dose_occurrence_id);

        CREATE INDEX IF NOT EXISTS idx_medication_schedules_medication
        ON medication_schedules(medication_id);

        CREATE INDEX IF NOT EXISTS idx_dose_logs_medication
        ON dose_logs(medication_id);

        CREATE INDEX IF NOT EXISTS idx_dose_logs_schedule
        ON dose_logs(schedule_id);

        CREATE INDEX IF NOT EXISTS idx_dose_logs_occurrence
        ON dose_logs(dose_occurrence_id, action_at);

        CREATE INDEX IF NOT EXISTS idx_notification_mappings_medication
        ON notification_mappings(medication_id);

        CREATE INDEX IF NOT EXISTS idx_notification_mappings_schedule
        ON notification_mappings(schedule_id);

        CREATE INDEX IF NOT EXISTS idx_reminder_artifacts_schedule
        ON reminder_artifacts(schedule_id);
      `);

      currentVersion = 3;
    }

    await assertForeignKeyIntegrity(transaction);
    await transaction.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
