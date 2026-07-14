import { migrateDbIfNeeded } from "../migrations";
import { createTestDatabase } from "../testing/testDatabase";

describe("database migrations", () => {
  it("enables foreign keys again when an already migrated database is reopened", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      await db.execAsync("PRAGMA foreign_keys = OFF");
      expect(
        (await db.getFirstAsync<{ foreign_keys: number }>(
          "PRAGMA foreign_keys"
        ))?.foreign_keys
      ).toBe(0);

      await migrateDbIfNeeded(db);

      expect(
        (await db.getFirstAsync<{ foreign_keys: number }>(
          "PRAGMA foreign_keys"
        ))?.foreign_keys
      ).toBe(1);
    } finally {
      close();
    }
  });

  it("resumes safely when schema changes exist but the version was not recorded", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      await db.execAsync("PRAGMA user_version = 1");

      await expect(migrateDbIfNeeded(db)).resolves.toBeUndefined();
    } finally {
      close();
    }
  });

  it("preserves an existing snooze preference when replaying version 2", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      await db.runAsync(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
        "defaultSnoozeMinutes",
        "10"
      );
      await db.execAsync("PRAGMA user_version = 1");

      await migrateDbIfNeeded(db);

      const setting = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM app_settings WHERE key = ?",
        "defaultSnoozeMinutes"
      );
      expect(setting?.value).toBe("10");
    } finally {
      close();
    }
  });

  it("rejects an already migrated database with foreign-key violations", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      await db.execAsync("PRAGMA foreign_keys = OFF");
      await db.runAsync(
        `INSERT INTO medication_schedules
         (id, medication_id, kind, times, interval_hours, weekdays,
          start_date, end_date, anchor_at, snooze_minutes, is_active)
         VALUES ('orphan', 'missing', 'dailyTimes', '["08:00"]', 0, '[]',
                 '', '', '', 5, 1)`
      );

      await expect(migrateDbIfNeeded(db)).rejects.toThrow(
        "Database contains foreign-key violations"
      );
    } finally {
      close();
    }
  });

  it("migrates the database to version 3", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      const version = await db.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version"
      );

      expect(version?.user_version).toBe(3);
    } finally {
      close();
    }
  });

  it("keeps only one active schedule per medication when upgrading legacy data", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      await db.execAsync(`
        DROP INDEX IF EXISTS idx_medication_schedules_one_active;
        PRAGMA user_version = 2;
      `);
      await db.runAsync(
        `INSERT INTO medications
         (id, name, dosage, notes, created_at, updated_at, is_paused)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        "med-1",
        "Teste",
        "10 mg",
        "",
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
        0
      );

      for (const id of ["schedule-1", "schedule-2"]) {
        await db.runAsync(
          `INSERT INTO medication_schedules
           (id, medication_id, kind, times, interval_hours, weekdays,
            start_date, end_date, anchor_at, snooze_minutes, is_active)
           VALUES (?, ?, 'dailyTimes', '["08:00"]', 0, '[]', '', '', '', 5, 1)`,
          id,
          "med-1"
        );
      }

      await migrateDbIfNeeded(db);

      const active = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) AS count FROM medication_schedules
         WHERE medication_id = ? AND is_active = 1`,
        "med-1"
      );
      expect(active?.count).toBe(1);

      await expect(
        db.runAsync(
          `INSERT INTO medication_schedules
           (id, medication_id, kind, times, interval_hours, weekdays,
            start_date, end_date, anchor_at, snooze_minutes, is_active)
           VALUES (?, ?, 'dailyTimes', '["09:00"]', 0, '[]', '', '', '', 5, 1)`,
          "schedule-3",
          "med-1"
        )
      ).rejects.toThrow();
    } finally {
      close();
    }
  });

  it("deletes medication-owned records through foreign-key cascades", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      await db.execAsync(`
        INSERT INTO medications
          (id, name, dosage, notes, created_at, updated_at, is_paused)
        VALUES ('med-1', 'Teste', '10 mg', '', '2026-01-01', '2026-01-01', 0);
        INSERT INTO medication_schedules
          (id, medication_id, kind, times, interval_hours, weekdays,
           start_date, end_date, anchor_at, snooze_minutes, is_active)
        VALUES ('schedule-1', 'med-1', 'dailyTimes', '["08:00"]', 0, '[]', '', '', '', 5, 1);
        INSERT INTO dose_logs
          (id, dose_occurrence_id, medication_id, schedule_id, action,
           action_at, snoozed_until, command_id)
        VALUES ('log-1', 'dose-1', 'med-1', 'schedule-1', 'taken', '2026-01-01', '', '');
        INSERT INTO notification_mappings
          (id, medication_id, schedule_id, dose_occurrence_id,
           notification_id, scheduled_for)
        VALUES ('mapping-1', 'med-1', 'schedule-1', 'dose-1', 'native-1', '2026-01-01');
        INSERT INTO reminder_artifacts
          (id, kind, notification_id, dose_occurrence_id, medication_id,
           schedule_id, dose_window_key, scheduled_for, expires_at, created_at)
        VALUES ('artifact-1', 'doseAlarm', 'native-2', 'dose-1', 'med-1',
                'schedule-1', 'window-1', '2026-01-01', '', '2026-01-01');
        DELETE FROM medications WHERE id = 'med-1';
      `);

      for (const table of [
        "medication_schedules",
        "dose_logs",
        "notification_mappings",
        "reminder_artifacts",
      ]) {
        const result = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) AS count FROM ${table}`
        );
        expect(result?.count).toBe(0);
      }
    } finally {
      close();
    }
  });
});
