import notifee from "@notifee/react-native";
import type { ReminderArtifactRepository } from "../../database/repositories/reminderArtifactRepository";
import type {
  DoseOccurrence,
  Medication,
  MedicationSchedule,
} from "../../types/domain";

jest.mock("../notificationPermissionService", () => ({
  getReminderPermissionState: jest.fn(async () => ({
    notifications: "granted",
    exactAlarms: "granted",
    fullScreen: "granted",
    doNotDisturb: "granted",
    criticalAlarmChannel: "bypasses",
    batteryOptimization: "unknown",
  })),
}));

import { createReminderScheduler } from "../reminderScheduler";

const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const occurrence: DoseOccurrence = {
  id: "dose-1",
  medicationId: "med-1",
  scheduleId: "schedule-1",
  scheduledAt: future,
  status: "pending",
};
const medication: Medication = {
  id: "med-1",
  name: "Dipirona",
  dosage: "500 mg",
  notes: "Após o almoço",
  createdAt: future,
  updatedAt: future,
  isPaused: false,
};
const schedule: MedicationSchedule = {
  id: "schedule-1",
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

function repository() {
  return {
    create: jest.fn(async () => undefined),
    getByWindowKey: jest.fn(async () => []),
  } as unknown as ReminderArtifactRepository;
}

describe("reminder scheduler alarm transport", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses only the native alarm when native scheduling succeeds", async () => {
    const repo = repository();
    const alarmAudio = {
      available: true,
      schedule: jest.fn(async () => true),
      cancel: jest.fn(async () => undefined),
      cancelAll: jest.fn(async () => undefined),
    };
    const scheduler = createReminderScheduler(repo, alarmAudio);

    await scheduler.scheduleForOccurrence(occurrence, medication, schedule, {
      showLockScreenDetails: true,
      fullScreenAlarmEnabled: true,
      criticalAlertsEnabled: true,
    });

    expect(alarmAudio.schedule).toHaveBeenCalledWith(
      expect.stringMatching(/^native:/),
      expect.any(Number),
      60_000,
      expect.objectContaining({
        medicationId: "med-1",
        artifactKind: "doseAlarm",
        fullScreenEnabled: true,
        criticalAlertsEnabled: true,
      })
    );
    const triggerNotifications = (
      notifee.createTriggerNotification as jest.Mock
    ).mock.calls.map(([notification]) => notification);
    expect(triggerNotifications).toHaveLength(3);
    expect(triggerNotifications).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({ artifactKind: "doseAlarm" }),
        }),
      ])
    );
  });

  it("creates exactly one Notifee trigger when native scheduling declines", async () => {
    const repo = repository();
    const alarmAudio = {
      available: true,
      schedule: jest.fn(async () => false),
      cancel: jest.fn(async () => undefined),
      cancelAll: jest.fn(async () => undefined),
    };
    (notifee.createTriggerNotification as jest.Mock).mockResolvedValue(
      "fallback-trigger"
    );
    const scheduler = createReminderScheduler(repo, alarmAudio);

    await scheduler.scheduleForOccurrence(occurrence, medication, schedule);

    const triggerNotifications = (
      notifee.createTriggerNotification as jest.Mock
    ).mock.calls.map(([notification]) => notification);
    expect(triggerNotifications).toHaveLength(4);
    expect(triggerNotifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({ artifactKind: "doseAlarm" }),
        }),
      ])
    );
  });

  it("uses only the native transport for an alarm test", async () => {
    const repo = repository();
    const alarmAudio = {
      available: true,
      schedule: jest.fn(async () => true),
      cancel: jest.fn(async () => undefined),
      cancelAll: jest.fn(async () => undefined),
    };
    const scheduler = createReminderScheduler(repo, alarmAudio);

    await expect(
      scheduler.runAlarmTest({
        criticalAlertsEnabled: true,
        fullScreenAlarmEnabled: true,
      })
    ).resolves.toMatch(/^native:alarm-test:/);

    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it("cancels a persisted native artifact without requiring Notifee", async () => {
    const nativeArtifact = {
      id: "artifact-1",
      kind: "doseAlarm" as const,
      notificationId: "native:artifact-1",
      doseOccurrenceId: "dose-1",
      medicationId: "med-1",
      scheduleId: "schedule-1",
      doseWindowKey: "2026-07-19T08:00",
      scheduledFor: future,
      expiresAt: "",
      createdAt: future,
    };
    const repo = {
      getByDoseOccurrenceId: jest.fn(async () => [nativeArtifact]),
      remove: jest.fn(async () => undefined),
    } as unknown as ReminderArtifactRepository;
    const alarmAudio = {
      available: true,
      schedule: jest.fn(async () => true),
      cancel: jest.fn(async () => undefined),
      cancelAll: jest.fn(async () => undefined),
    };
    const scheduler = createReminderScheduler(repo, alarmAudio);

    await scheduler.cancelSingle("dose-1");

    expect(alarmAudio.cancel).toHaveBeenCalledWith("native:artifact-1");
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
    expect(repo.remove).toHaveBeenCalledWith("artifact-1");
  });

  it("cancels a native alarm if persisting its artifact fails", async () => {
    const repo = {
      create: jest.fn(async () => {
        throw new Error("artifact persistence failed");
      }),
      getByWindowKey: jest.fn(async () => []),
    } as unknown as ReminderArtifactRepository;
    const alarmAudio = {
      available: true,
      schedule: jest.fn(async () => true),
      cancel: jest.fn(async () => undefined),
      cancelAll: jest.fn(async () => undefined),
    };
    const scheduler = createReminderScheduler(repo, alarmAudio);

    await expect(
      scheduler.scheduleForOccurrence(occurrence, medication, schedule, {
        snoozed: true,
        alarmAt: new Date(future),
      })
    ).rejects.toThrow("artifact persistence failed");

    expect(alarmAudio.cancel).toHaveBeenCalledWith(
      expect.stringMatching(/^native:/)
    );
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
  });
});
