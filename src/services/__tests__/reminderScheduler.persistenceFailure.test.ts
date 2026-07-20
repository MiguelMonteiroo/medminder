import notifee from "@notifee/react-native";
import type { ReminderArtifactRepository } from "../../database/repositories/reminderArtifactRepository";
import type { DoseOccurrence, Medication, MedicationSchedule } from "../../types/domain";

jest.mock("../notificationPermissionService", () => ({
  getReminderPermissionState: jest.fn(async () => ({
    notifications: "granted",
    exactAlarms: "granted",
    fullScreen: "granted",
    doNotDisturb: "denied",
    criticalAlarmChannel: "unavailable",
    batteryOptimization: "unknown",
  })),
}));

import { createReminderScheduler } from "../reminderScheduler";

describe("reminder scheduler persistence failure", () => {
  it("cancels a notification when its artifact cannot be persisted", async () => {
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000);
    const occurrence: DoseOccurrence = {
      id: "dose-1",
      medicationId: "med-1",
      scheduleId: "schedule-1",
      scheduledAt: scheduledAt.toISOString(),
      status: "pending",
    };
    const medication: Medication = {
      id: "med-1",
      name: "Dipirona",
      dosage: "500 mg",
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPaused: false,
    };
    const schedule: MedicationSchedule = {
      id: "schedule-1",
      medicationId: medication.id,
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
    const artifactRepo = {
      create: jest.fn(async () => {
        throw new Error("database write failed");
      }),
      getByWindowKey: jest.fn(async () => []),
    } as unknown as ReminderArtifactRepository;
    const alarmAudio = {
      available: false,
      cancel: jest.fn(async () => undefined),
      cancelAll: jest.fn(async () => undefined),
      getScheduledIds: jest.fn(async () => []),
      schedule: jest.fn(async () => false),
    };
    const createTriggerNotification =
      notifee.createTriggerNotification as jest.Mock;
    const cancelNotification = notifee.cancelNotification as jest.Mock;
    createTriggerNotification.mockResolvedValueOnce("native-trigger-1");
    cancelNotification.mockResolvedValueOnce(undefined);
    const scheduler = createReminderScheduler(artifactRepo, alarmAudio);

    await expect(
      scheduler.scheduleForOccurrence(occurrence, medication, schedule)
    ).rejects.toThrow("database write failed");

    expect(cancelNotification).toHaveBeenCalledWith("native-trigger-1");
  });
});
