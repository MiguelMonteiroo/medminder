import notifee from "@notifee/react-native";
import { createRepositories } from "../../database/db";
import { migrateDbIfNeeded } from "../../database/migrations";
import { createTestDatabase } from "../../database/testing/testDatabase";
import { createMedicationPersistenceService } from "../medicationPersistenceService";
import { createReminderScheduler } from "../reminderScheduler";

describe("reminder scheduler cancellation", () => {
  it("preserves the artifact when the native trigger cannot be canceled", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      const repositories = createRepositories(db);
      const persistence = createMedicationPersistenceService(db);
      await persistence.createWithSchedule(
        {
          id: "med-1",
          name: "Dipirona",
          dosage: "500 mg",
          notes: "",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          isPaused: false,
        },
        {
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
        }
      );
      await repositories.reminderArtifacts.create({
        id: "artifact-1",
        kind: "doseAlarm",
        notificationId: "native-1",
        doseOccurrenceId: "dose-1",
        medicationId: "med-1",
        scheduleId: "schedule-1",
        doseWindowKey: "2026-01-01T08:00",
        scheduledFor: "2026-01-01T08:00:00",
        expiresAt: "",
        createdAt: "2026-01-01T00:00:00.000Z",
      });
      const cancelNotification = notifee.cancelNotification as jest.Mock;
      cancelNotification.mockRejectedValueOnce(new Error("native failure"));
      const scheduler = createReminderScheduler(
        repositories.reminderArtifacts
      );

      await expect(scheduler.cancelSingle("dose-1")).rejects.toThrow(
        "native failure"
      );
      await expect(
        repositories.reminderArtifacts.getByDoseOccurrenceId("dose-1")
      ).resolves.toHaveLength(1);
    } finally {
      close();
    }
  });
});
