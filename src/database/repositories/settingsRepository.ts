import type { NativeDB } from "../nativeDb";
import { ReminderSettings } from "../../types/domain";

const DEFAULT_SETTINGS: ReminderSettings = {
  notificationsEnabled: false,
  defaultSnoozeMinutes: 5,
  userName: "Maria",
  fullScreenAlarmEnabled: false,
  showLockScreenDetails: false,
  reminderSetupCompleted: false,
};

export function createSettingsRepository(db: NativeDB) {
  async function get(): Promise<ReminderSettings> {
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      "SELECT * FROM app_settings"
    );
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return {
      notificationsEnabled:
        map.notificationsEnabled === "true" ||
        DEFAULT_SETTINGS.notificationsEnabled,
      defaultSnoozeMinutes: map.defaultSnoozeMinutes
        ? parseInt(map.defaultSnoozeMinutes, 10)
        : DEFAULT_SETTINGS.defaultSnoozeMinutes,
      userName: map.userName || DEFAULT_SETTINGS.userName,
      fullScreenAlarmEnabled: map.fullScreenAlarmEnabled === "true",
      showLockScreenDetails: map.showLockScreenDetails === "true",
      reminderSetupCompleted: map.reminderSetupCompleted === "true",
    };
  }

  async function update(settings: ReminderSettings): Promise<void> {
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
      "notificationsEnabled",
      settings.notificationsEnabled ? "true" : "false"
    );
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
      "defaultSnoozeMinutes",
      settings.defaultSnoozeMinutes.toString()
    );
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
      "userName",
      settings.userName
    );
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
      "fullScreenAlarmEnabled",
      settings.fullScreenAlarmEnabled ? "true" : "false"
    );
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
      "showLockScreenDetails",
      settings.showLockScreenDetails ? "true" : "false"
    );
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
      "reminderSetupCompleted",
      settings.reminderSetupCompleted ? "true" : "false"
    );
  }

  return { get, update };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
