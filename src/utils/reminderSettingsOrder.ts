export const REMINDER_SETTING_ORDER = [
  "notifications",
  "silentMode",
  "exactAlarm",
  "fullScreen",
  "lockScreenDetails",
  "background",
] as const;

export type ReminderSettingKey = (typeof REMINDER_SETTING_ORDER)[number];
