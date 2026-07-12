import {
  processNotificationAction,
  type NotificationActionDependencies,
} from "../notificationActionHandler";
import type { DoseLog, Medication, MedicationSchedule } from "../../../types/domain";

function createDependencies(existingLogs: DoseLog[] = []) {
  const logs = [...existingLogs];
  const cancelled: string[] = [];
  const scheduled: string[] = [];
  const confirmations: string[] = [];
  const medication: Medication = {
    id: "med-1",
    name: "Dipirona",
    dosage: "5 mg",
    notes: "",
    createdAt: "2026-07-03T00:00:00",
    updatedAt: "2026-07-03T00:00:00",
    isPaused: false,
  };
  const schedule: MedicationSchedule = {
    id: "sched-1",
    medicationId: "med-1",
    kind: "dailyTimes",
    times: ["08:00"],
    intervalHours: 0,
    weekdays: [],
    startDate: "",
    endDate: "",
    anchorAt: "",
    snoozeMinutes: 5,
    isActive: true,
  };

  const dependencies: NotificationActionDependencies = {
    now: () => new Date("2026-07-03T08:00:00-03:00"),
    getMedication: async () => medication,
    getSchedule: async () => schedule,
    getSettings: async () => ({
      notificationsEnabled: true,
      defaultSnoozeMinutes: 5,
      userName: "Maria",
      fullScreenAlarmEnabled: true,
      showLockScreenDetails: true,
      reminderSetupCompleted: true,
    }),
    getLogs: async () => logs,
    appendLog: async (log) => {
      if (log.commandId && logs.some((item) => item.commandId === log.commandId)) {
        return false;
      }
      logs.push(log);
      return true;
    },
    cancelOccurrence: async (id) => {
      cancelled.push(id);
    },
    scheduleSnoozed: async (occurrence) => {
      scheduled.push(occurrence.scheduledAt);
    },
    showTakenConfirmation: async (occurrence) => {
      confirmations.push(occurrence.id);
    },
    showPending: async () => undefined,
    cancelNotification: async () => undefined,
  };

  return { dependencies, logs, cancelled, scheduled, confirmations };
}

const baseCommand = {
  doseOccurrenceId: "occ-1",
  medicationId: "med-1",
  scheduleId: "sched-1",
  scheduledAt: "2026-07-03T08:00:00",
  notificationId: "notification-1",
};

describe("processNotificationAction", () => {
  it("records a taken action once when the same command is retried", async () => {
    const state = createDependencies();
    const command = {
      ...baseCommand,
      actionId: "mark-taken" as const,
      commandId: "notification-1:mark-taken",
    };

    await processNotificationAction(command, state.dependencies);
    await processNotificationAction(command, state.dependencies);

    expect(state.logs.filter((log) => log.action === "taken")).toHaveLength(1);
    expect(state.confirmations).toEqual(["occ-1"]);
  });

  it("schedules a five-minute alarm before the snooze limit", async () => {
    const state = createDependencies();

    const result = await processNotificationAction(
      {
        ...baseCommand,
        actionId: "snooze-five",
        commandId: "notification-1:snooze-five",
      },
      state.dependencies
    );

    expect(result).toEqual({ status: "snoozed", snoozeCount: 1 });
    expect(state.scheduled).toEqual(["2026-07-03T11:05:00.000Z"]);
  });

  it("does not schedule a fourth snoozed alarm", async () => {
    const existing = [1, 2, 3].map((index) => ({
      id: `log-${index}`,
      doseOccurrenceId: "occ-1",
      medicationId: "med-1",
      scheduleId: "sched-1",
      action: "snoozed" as const,
      actionAt: `2026-07-03T07:${50 + index}:00`,
      snoozedUntil: "2026-07-03T08:00:00",
    }));
    const state = createDependencies(existing);

    const result = await processNotificationAction(
      {
        ...baseCommand,
        actionId: "snooze-five",
        commandId: "notification-1:snooze-five",
      },
      state.dependencies
    );

    expect(result).toEqual({ status: "snooze-limit", snoozeCount: 3 });
    expect(state.scheduled).toHaveLength(0);
  });
});
