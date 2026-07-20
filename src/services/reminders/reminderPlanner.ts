import type {
  DoseOccurrence,
  ReminderArtifactKind,
} from "../../types/domain";
import { formatLocalDateTime } from "../../utils/dateTime";

const MINUTE_MS = 60_000;

export type PlannedReminder = {
  kind: ReminderArtifactKind;
  doseOccurrenceId: string;
  medicationId: string;
  scheduleId: string;
  doseWindowKey: string;
  scheduledFor: string;
  expiresAt: string;
};

type PlanOptions = {
  alarmAt?: Date;
  snoozed?: boolean;
};

function createPlan(
  occurrence: DoseOccurrence,
  kind: ReminderArtifactKind,
  scheduledAt: Date,
  doseWindowKey: string
): PlannedReminder {
  return {
    kind,
    doseOccurrenceId: occurrence.id,
    medicationId: occurrence.medicationId,
    scheduleId: occurrence.scheduleId,
    doseWindowKey,
    scheduledFor: formatLocalDateTime(scheduledAt),
    expiresAt: "",
  };
}

export function planOccurrenceReminders(
  occurrence: DoseOccurrence,
  now = new Date(),
  options: PlanOptions = {}
): PlannedReminder[] {
  const originalAlarmAt = new Date(occurrence.scheduledAt);
  const alarmAt = options.alarmAt ?? originalAlarmAt;
  if (!Number.isFinite(alarmAt.getTime())) return [];

  const windowKey = occurrence.scheduledAt.slice(0, 16);
  const candidates: Array<[ReminderArtifactKind, Date]> = [];

  if (!options.snoozed) {
    candidates.push(["preAlert", new Date(alarmAt.getTime() - 5 * MINUTE_MS)]);
  }

  candidates.push([
    options.snoozed ? "snoozedAlarm" : "doseAlarm",
    alarmAt,
  ]);
  candidates.push(["alarmHandoff", new Date(alarmAt.getTime() + MINUTE_MS)]);
  candidates.push([
    "reinforcement",
    new Date(alarmAt.getTime() + 10 * MINUTE_MS),
  ]);

  return candidates
    .filter(([kind, scheduledAt]) =>
      kind === "preAlert"
        ? alarmAt.getTime() > now.getTime()
        : scheduledAt.getTime() > now.getTime()
    )
    .map(([kind, scheduledAt]) =>
      createPlan(occurrence, kind, scheduledAt, windowKey)
    );
}
