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
  snoozeMinutes: number;
  isActive: boolean;
};

export type DoseStatus = "pending" | "taken" | "skipped" | "snoozed" | "missed";

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
};
