import type { ReminderSettings } from "../types/domain";

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  notificationsEnabled: false,
  defaultSnoozeMinutes: 5,
  userName: "",
  fullScreenAlarmEnabled: false,
  criticalAlertsEnabled: false,
  showLockScreenDetails: false,
  reminderSetupCompleted: false,
  onboardingCompleted: false,
};
