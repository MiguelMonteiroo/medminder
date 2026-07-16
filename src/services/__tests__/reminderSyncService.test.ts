import { createRepositories } from "../../database/db";
import { migrateDbIfNeeded } from "../../database/migrations";
import { createTestDatabase } from "../../database/testing/testDatabase";
import type {
  DoseOccurrence,
  Medication,
  MedicationSchedule,
} from "../../types/domain";
import { createMedicationPersistenceService } from "../medicationPersistenceService";
import type { ReminderScheduler } from "../reminderScheduler";
import {
  reconcileNotifications,
  reminderArtifactsMatchPlans,
} from "../reminderSyncService";
import { planOccurrenceReminders } from "../reminders/reminderPlanner";

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

describe("reminder synchronization", () => {
  it("rejects native artifacts that still point to the pre-edit time", () => {
    const occurrence: DoseOccurrence = {
      id: "med-1-schedule-1-2026-07-14-0",
      medicationId: "med-1",
      scheduleId: "schedule-1",
      scheduledAt: "2026-07-14T14:00:00",
      status: "pending",
    };
    const plans = planOccurrenceReminders(
      occurrence,
      new Date("2026-07-14T00:00:00")
    );
    const artifacts = plans.map((plan, index) => ({
      id: `artifact-${index}`,
      kind: plan.kind,
      notificationId: `native-${index}`,
      doseOccurrenceId: occurrence.id,
      medicationId: occurrence.medicationId,
      scheduleId: occurrence.scheduleId,
      doseWindowKey: "2026-07-14T12:00",
      scheduledFor: plan.scheduledFor.replace("T14:", "T12:"),
      expiresAt: "",
      createdAt: "2026-07-13T00:00:00",
    }));

    expect(reminderArtifactsMatchPlans(artifacts, plans)).toBe(false);
  });

  it("recreates future reminders whose native triggers disappeared", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      const repos = createRepositories(db);
      const persistence = createMedicationPersistenceService(db);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const date = localDate(tomorrow);
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
        times: ["12:00"],
        intervalHours: 0,
        weekdays: [],
        startDate: "",
        endDate: "",
        anchorAt: "",
        snoozeMinutes: 5,
        isActive: true,
      };
      const occurrence: DoseOccurrence = {
        id: `${medication.id}-${schedule.id}-${date}-0`,
        medicationId: medication.id,
        scheduleId: schedule.id,
        scheduledAt: `${date}T12:00:00`,
        status: "pending",
      };
      await persistence.createWithSchedule(medication, schedule);
      await repos.settings.update({
        notificationsEnabled: true,
        defaultSnoozeMinutes: 5,
        userName: "Maria",
        fullScreenAlarmEnabled: false,
        criticalAlertsEnabled: false,
        showLockScreenDetails: false,
        reminderSetupCompleted: true,
        onboardingCompleted: true,
      });

      const plans = planOccurrenceReminders(occurrence);
      for (const [index, plan] of plans.entries()) {
        await repos.reminderArtifacts.create({
          id: `artifact-${index}`,
          kind: plan.kind,
          notificationId: `missing-native-${index}`,
          doseOccurrenceId: occurrence.id,
          medicationId: medication.id,
          scheduleId: schedule.id,
          doseWindowKey: occurrence.scheduledAt.slice(0, 16),
          scheduledFor: plan.scheduledFor,
          expiresAt: "",
          createdAt: new Date().toISOString(),
        });
      }

      const scheduler = {
        cancelSingle: jest.fn().mockResolvedValue(undefined),
        scheduleForOccurrence: jest
          .fn()
          .mockResolvedValue(["replacement-trigger"]),
      } as unknown as ReminderScheduler;

      const result = await reconcileNotifications(
        repos.reminderArtifacts,
        repos.medications,
        repos.schedules,
        repos.settings,
        scheduler
      );

      expect(result.removed).toBe(plans.length);
      expect(result.recreated).toBeGreaterThanOrEqual(1);
      expect(scheduler.scheduleForOccurrence).toHaveBeenCalledWith(
        expect.objectContaining({ id: occurrence.id }),
        medication,
        schedule,
        expect.any(Object)
      );
    } finally {
      close();
    }
  });
});
