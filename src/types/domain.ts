export type Medication = {
  id: string;
  name: string;
  dosage: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  isPaused: boolean;
};

export type ScheduleKind = "dailyTimes" | "intervalHours" | "weekdays";

export type MedicationSchedule = {
  id: string;
  medicationId: string;
  kind: ScheduleKind;
  times: string[];
  intervalHours: number;
  weekdays: number[];
  startDate: string;
  endDate: string;
  anchorAt: string;
  snoozeMinutes: number;
  isActive: boolean;
};

export type DoseStatus = "pending" | "taken" | "skipped" | "snoozed" | "unrecorded";

export type DoseOccurrence = {
  id: string;
  medicationId: string;
  scheduleId: string;
  scheduledAt: string;
  status: DoseStatus;
};

export type DoseAction = "taken" | "skipped" | "snoozed" | "undone";

export type DoseLog = {
  id: string;
  doseOccurrenceId: string;
  medicationId: string;
  scheduleId: string;
  action: DoseAction;
  actionAt: string;
  snoozedUntil: string;
  commandId?: string;
};

export type ReminderNotification = {
  id: string;
  medicationId: string;
  scheduleId: string;
  doseOccurrenceId: string;
  notificationId: string;
  scheduledFor: string;
};

export type ReminderSettings = {
  notificationsEnabled: boolean;
  defaultSnoozeMinutes: number;
  userName: string;
  fullScreenAlarmEnabled: boolean;
  criticalAlertsEnabled: boolean;
  showLockScreenDetails: boolean;
  reminderSetupCompleted: boolean;
  onboardingCompleted: boolean;
};

export type ReminderArtifactKind =
  | "preAlert"
  | "doseAlarm"
  | "alarmHandoff"
  | "reinforcement"
  | "snoozedAlarm"
  | "takenConfirmation"
  | "alarmTest";

export type ReminderArtifact = {
  id: string;
  kind: ReminderArtifactKind;
  notificationId: string;
  doseOccurrenceId: string;
  medicationId: string;
  scheduleId: string;
  doseWindowKey: string;
  scheduledFor: string;
  expiresAt: string;
  createdAt: string;
};

export type ReminderPermissionState = {
  notifications: "granted" | "denied" | "blocked";
  exactAlarms: "granted" | "denied" | "notRequired";
  fullScreen: "granted" | "denied" | "unsupported";
  doNotDisturb: "granted" | "denied";
  batteryOptimization: "optimized" | "unrestricted" | "unknown";
};

export type NotificationActionId =
  | "mark-taken"
  | "snooze-five"
  | "undo-taken"
  | "open-dose-window"
  | "end-alarm-test";
