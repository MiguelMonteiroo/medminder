import { migrateDbIfNeeded } from "../migrations";
import { createSettingsRepository } from "../repositories/settingsRepository";
import type { ReminderSettings } from "../../types/domain";
import { createTestDatabase } from "../testing/testDatabase";

const updatedSettings: ReminderSettings = {
  notificationsEnabled: true,
  defaultSnoozeMinutes: 10,
  userName: "Miguel",
  fullScreenAlarmEnabled: true,
  showLockScreenDetails: true,
  reminderSetupCompleted: true,
  onboardingCompleted: true,
};

describe("settings repository", () => {
  it("returns safe defaults for a new database", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      const repository = createSettingsRepository(db);

      await expect(repository.get()).resolves.toEqual({
        notificationsEnabled: false,
        defaultSnoozeMinutes: 5,
        userName: "",
        fullScreenAlarmEnabled: false,
        showLockScreenDetails: false,
        reminderSetupCompleted: false,
        onboardingCompleted: false,
      });
    } finally {
      close();
    }
  });

  it("falls back safely when a stored snooze value is invalid", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      const repository = createSettingsRepository(db);
      await db.runAsync(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
        "defaultSnoozeMinutes",
        "invalid"
      );

      expect((await repository.get()).defaultSnoozeMinutes).toBe(5);
    } finally {
      close();
    }
  });

  it("rolls back every setting when one value cannot be persisted", async () => {
    const { db, close, execScript } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      const repository = createSettingsRepository(db);
      const initial = await repository.get();
      execScript(`
        CREATE TRIGGER reject_user_name
        BEFORE INSERT ON app_settings
        WHEN NEW.key = 'userName'
        BEGIN
          SELECT RAISE(ABORT, 'user name rejected');
        END;
      `);

      await expect(repository.update(updatedSettings)).rejects.toThrow();
      await expect(repository.get()).resolves.toEqual(initial);
    } finally {
      close();
    }
  });

  it("persists the complete settings snapshot", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      const repository = createSettingsRepository(db);

      await repository.update(updatedSettings);

      await expect(repository.get()).resolves.toEqual(updatedSettings);
    } finally {
      close();
    }
  });
});
