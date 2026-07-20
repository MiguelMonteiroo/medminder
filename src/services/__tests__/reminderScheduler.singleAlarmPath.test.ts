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

function memoryRepository() {
  const artifacts: any[] = [];
  return {
    create: jest.fn(async (artifact) => {
      const index = artifacts.findIndex((candidate) => candidate.id === artifact.id);
      if (index >= 0) artifacts[index] = artifact;
      else artifacts.push(artifact);
    }),
    getByWindowKey: jest.fn(async (windowKey) =>
      artifacts.filter((artifact) => artifact.doseWindowKey === windowKey)
    ),
  } as unknown as ReminderArtifactRepository;
}

describe("reminder scheduler alarm transport", () => {
  beforeEach(() => jest.clearAllMocks());

  it("displays and persists an immediate pre-alert when the five-minute mark already passed", async () => {
    const repo = repository();
    const alarmAudio = {
      available: true,
      schedule: jest.fn(async () => true),
      cancel: jest.fn(async () => undefined),
      cancelAll: jest.fn(async () => undefined),
    };
    (notifee.displayNotification as jest.Mock).mockResolvedValue(
      "immediate-pre-alert"
    );
    const scheduler = createReminderScheduler(repo, alarmAudio);
    const nearOccurrence: DoseOccurrence = {
      ...occurrence,
      id: "dose-near",
      scheduledAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    };

    await scheduler.scheduleForOccurrence(
      nearOccurrence,
      medication,
      schedule
    );

    expect(notifee.displayNotification).toHaveBeenCalledTimes(1);
    expect(notifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^pre-alert:/),
        data: expect.objectContaining({ artifactKind: "preAlert" }),
      })
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "preAlert",
        notificationId: "immediate-pre-alert",
      })
    );
  });

  it("keeps pre-alert notification IDs distinct for different dose times", async () => {
    const repo = repository();
    const alarmAudio = {
      available: true,
      schedule: jest.fn(async () => true),
      cancel: jest.fn(async () => undefined),
      cancelAll: jest.fn(async () => undefined),
    };
    const scheduler = createReminderScheduler(repo, alarmAudio);

    await scheduler.scheduleForOccurrence(
      {
        ...occurrence,
        id: "dose-first",
        scheduledAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      },
      medication,
      schedule
    );
    await scheduler.scheduleForOccurrence(
      {
        ...occurrence,
        id: "dose-second",
        scheduledAt: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
      },
      medication,
      schedule
    );

    const preAlertIds = (repo.create as jest.Mock).mock.calls
      .map(([artifact]) => artifact)
      .filter((artifact) => artifact.kind === "preAlert")
      .map((artifact) => artifact.id);
    expect(preAlertIds).toHaveLength(2);
    expect(new Set(preAlertIds).size).toBe(2);
  });

  it("keeps one grouped pre-alert for medications scheduled in the same minute", async () => {
    const repo = memoryRepository();
    const alarmAudio = {
      available: true,
      schedule: jest.fn(async () => true),
      cancel: jest.fn(async () => undefined),
      cancelAll: jest.fn(async () => undefined),
    };
    (notifee.createTriggerNotification as jest.Mock).mockImplementation(
      async (notification) => notification.id
    );
    const scheduler = createReminderScheduler(repo, alarmAudio);
    const sharedTime = new Date(Date.now() + 20 * 60 * 1000).toISOString();

    await scheduler.scheduleForOccurrence(
      { ...occurrence, id: "dose-first", scheduledAt: sharedTime },
      medication,
      schedule
    );
    await scheduler.scheduleForOccurrence(
      {
        ...occurrence,
        id: "dose-second",
        medicationId: "med-2",
        scheduledAt: sharedTime,
      },
      { ...medication, id: "med-2", name: "Losartana" },
      { ...schedule, id: "schedule-2", medicationId: "med-2" }
    );

    const preAlerts = (
      notifee.createTriggerNotification as jest.Mock
    ).mock.calls
      .map(([notification]) => notification)
      .filter((notification) => notification.data?.artifactKind === "preAlert");
    expect(preAlerts).toHaveLength(2);
    expect(preAlerts[0].id).toBe(preAlerts[1].id);
    expect(preAlerts[1].title).toBe("2 medicamentos em 5 minutos");
  });

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
