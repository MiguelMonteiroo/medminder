import type {
  DoseLog,
  DoseOccurrence,
  Medication,
  MedicationSchedule,
  NotificationActionId,
  ReminderSettings,
} from "../../types/domain";

export type NotificationActionCommand = {
  actionId: NotificationActionId;
  commandId: string;
  doseOccurrenceId: string;
  medicationId: string;
  scheduleId: string;
  scheduledAt: string;
  notificationId: string;
};

export type NotificationActionDependencies = {
  now: () => Date;
  getMedication: (id: string) => Promise<Medication | null>;
  getSchedule: (id: string) => Promise<MedicationSchedule | null>;
  getSettings: () => Promise<ReminderSettings>;
  getLogs: (occurrenceId: string) => Promise<DoseLog[]>;
  appendLog: (log: DoseLog) => Promise<boolean>;
  cancelOccurrence: (occurrenceId: string) => Promise<void>;
  scheduleSnoozed: (
    occurrence: DoseOccurrence,
    medication: Medication,
    schedule: MedicationSchedule,
    settings: ReminderSettings
  ) => Promise<void>;
  showTakenConfirmation: (
    occurrence: DoseOccurrence,
    medication: Medication
  ) => Promise<void>;
  showPending: (
    occurrence: DoseOccurrence,
    medication: Medication,
    settings: ReminderSettings
  ) => Promise<void>;
  cancelNotification: (notificationId: string) => Promise<void>;
};

export type NotificationActionResult =
  | { status: "taken" | "duplicate" | "undone" | "opened" | "test-ended" }
  | { status: "snoozed" | "snooze-limit"; snoozeCount: number }
  | { status: "invalid" };

function occurrenceFromCommand(
  command: NotificationActionCommand,
  scheduledAt = command.scheduledAt
): DoseOccurrence {
  return {
    id: command.doseOccurrenceId,
    medicationId: command.medicationId,
    scheduleId: command.scheduleId,
    scheduledAt,
    status: "pending",
  };
}

function actionLog(
  command: NotificationActionCommand,
  action: DoseLog["action"],
  actionAt: string,
  snoozedUntil = ""
): DoseLog {
  return {
    id: `${command.doseOccurrenceId}:${command.commandId}`,
    doseOccurrenceId: command.doseOccurrenceId,
    medicationId: command.medicationId,
    scheduleId: command.scheduleId,
    action,
    actionAt,
    snoozedUntil,
    commandId: command.commandId,
  };
}

export async function processNotificationAction(
  command: NotificationActionCommand,
  dependencies: NotificationActionDependencies
): Promise<NotificationActionResult> {
  if (command.actionId === "open-dose-window") {
    return { status: "opened" };
  }

  if (command.actionId === "end-alarm-test") {
    await dependencies.cancelNotification(command.notificationId);
    return { status: "test-ended" };
  }

  const [medication, schedule] = await Promise.all([
    dependencies.getMedication(command.medicationId),
    dependencies.getSchedule(command.scheduleId),
  ]);
  if (!medication || !schedule || !command.doseOccurrenceId) {
    return { status: "invalid" };
  }

  const now = dependencies.now();
  const actionAt = now.toISOString();

  if (command.actionId === "mark-taken") {
    const created = await dependencies.appendLog(
      actionLog(command, "taken", actionAt)
    );
    if (!created) return { status: "duplicate" };

    const occurrence = occurrenceFromCommand(command);
    await dependencies.cancelOccurrence(command.doseOccurrenceId);
    await dependencies.showTakenConfirmation(occurrence, medication);
    return { status: "taken" };
  }

  if (command.actionId === "undo-taken") {
    const created = await dependencies.appendLog(
      actionLog(command, "undone", actionAt)
    );
    await dependencies.cancelNotification(command.notificationId);
    if (created) {
      const settings = await dependencies.getSettings();
      await dependencies.showPending(
        occurrenceFromCommand(command),
        medication,
        settings
      );
    }
    return { status: created ? "undone" : "duplicate" };
  }

  if (command.actionId === "snooze-five") {
    const logs = await dependencies.getLogs(command.doseOccurrenceId);
    const snoozeCount = logs.filter((log) => log.action === "snoozed").length;
    if (snoozeCount >= 3) {
      return { status: "snooze-limit", snoozeCount };
    }

    const snoozedUntil = new Date(now.getTime() + 5 * 60_000);
    const created = await dependencies.appendLog(
      actionLog(command, "snoozed", actionAt, snoozedUntil.toISOString())
    );
    if (!created) return { status: "duplicate" };

    await dependencies.cancelOccurrence(command.doseOccurrenceId);
    const settings = await dependencies.getSettings();
    await dependencies.scheduleSnoozed(
      occurrenceFromCommand(command, snoozedUntil.toISOString()),
      medication,
      schedule,
      settings
    );
    return { status: "snoozed", snoozeCount: snoozeCount + 1 };
  }

  return { status: "invalid" };
}
