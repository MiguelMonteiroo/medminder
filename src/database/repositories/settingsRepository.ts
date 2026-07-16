import type { NativeDB } from "../nativeDb";
import { ReminderSettings } from "../../types/domain";

const DEFAULT_SETTINGS: ReminderSettings = {
  notificationsEnabled: false,
  defaultSnoozeMinutes: 5,
  userName: "",
  fullScreenAlarmEnabled: false,
  criticalAlertsEnabled: false,
  showLockScreenDetails: false,
  reminderSetupCompleted: false,
  onboardingCompleted: false,
};

function parseSnoozeMinutes(value: string | undefined): number {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 60
    ? parsed
    : DEFAULT_SETTINGS.defaultSnoozeMinutes;
}

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
      defaultSnoozeMinutes: parseSnoozeMinutes(map.defaultSnoozeMinutes),
      userName: map.userName || DEFAULT_SETTINGS.userName,
      fullScreenAlarmEnabled: map.fullScreenAlarmEnabled === "true",
      criticalAlertsEnabled: map.criticalAlertsEnabled === "true",
      showLockScreenDetails: map.showLockScreenDetails === "true",
      reminderSetupCompleted: map.reminderSetupCompleted === "true",
      onboardingCompleted: map.onboardingCompleted === "true",
    };
  }

  async function update(settings: ReminderSettings): Promise<void> {
    const entries: Array<[string, string]> = [
      [
        "notificationsEnabled",
        settings.notificationsEnabled ? "true" : "false",
      ],
      ["defaultSnoozeMinutes", settings.defaultSnoozeMinutes.toString()],
      ["userName", settings.userName],
      [
        "fullScreenAlarmEnabled",
        settings.fullScreenAlarmEnabled ? "true" : "false",
      ],
      [
        "criticalAlertsEnabled",
        settings.criticalAlertsEnabled ? "true" : "false",
      ],
      [
        "showLockScreenDetails",
        settings.showLockScreenDetails ? "true" : "false",
      ],
      [
        "reminderSetupCompleted",
        settings.reminderSetupCompleted ? "true" : "false",
      ],
      [
        "onboardingCompleted",
        settings.onboardingCompleted ? "true" : "false",
      ],
    ];

    await db.withTransactionAsync(async (transaction) => {
      for (const [key, value] of entries) {
        await transaction.runAsync(
          "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
          key,
          value
        );
      }
    });
  }

  return { get, update };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
