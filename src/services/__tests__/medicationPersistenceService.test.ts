import { createRepositories } from "../../database/db";
import { migrateDbIfNeeded } from "../../database/migrations";
import { createTestDatabase } from "../../database/testing/testDatabase";
import type { Medication, MedicationSchedule } from "../../types/domain";
import { createMedicationPersistenceService } from "../medicationPersistenceService";

const medication: Medication = {
  id: "med-1",
  name: "Dipirona",
  dosage: "500 mg",
  notes: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  isPaused: false,
};

function schedule(
  id: string,
  medicationId = medication.id
): MedicationSchedule {
  return {
    id,
    medicationId,
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
}

describe("medication persistence service", () => {
  it("rolls back medication creation when its schedule cannot be saved", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      const repos = createRepositories(db);
      const service = createMedicationPersistenceService(db);

      await expect(
        service.createWithSchedule(medication, schedule("schedule-1", "missing-med"))
      ).rejects.toThrow();

      await expect(repos.medications.getById(medication.id)).resolves.toBeNull();
    } finally {
      close();
    }
  });

  it("rejects a schedule owned by another existing medication", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      const repos = createRepositories(db);
      const service = createMedicationPersistenceService(db);
      const otherMedication = { ...medication, id: "med-2", name: "Losartana" };
      await service.createWithSchedule(
        otherMedication,
        schedule("schedule-2", otherMedication.id)
      );

      await expect(
        service.createWithSchedule(
          medication,
          schedule("schedule-1", otherMedication.id)
        )
      ).rejects.toThrow("Schedule does not belong to medication");

      await expect(repos.medications.getById(medication.id)).resolves.toBeNull();
      await expect(repos.schedules.getByMedicationId(otherMedication.id)).resolves.toHaveLength(1);
    } finally {
      close();
    }
  });

  it("atomically replaces the active schedule while preserving history", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      const repos = createRepositories(db);
      const service = createMedicationPersistenceService(db);
      await service.createWithSchedule(medication, schedule("schedule-1"));

      const updatedMedication = {
        ...medication,
        name: "Dipirona sódica",
        updatedAt: "2026-01-02T00:00:00.000Z",
      };
      await service.updateWithSchedule(
        updatedMedication,
        schedule("schedule-2")
      );

      expect((await repos.medications.getById(medication.id))?.name).toBe(
        "Dipirona sódica"
      );
      expect(await repos.schedules.getByMedicationId(medication.id)).toEqual([
        expect.objectContaining({ id: "schedule-2", isActive: true }),
        expect.objectContaining({ id: "schedule-1", isActive: false }),
      ]);
    } finally {
      close();
    }
  });

  it("removes the medication and all records it owns", async () => {
    const { db, close } = createTestDatabase();

    try {
      await migrateDbIfNeeded(db);
      const repos = createRepositories(db);
      const service = createMedicationPersistenceService(db);
      const activeSchedule = schedule("schedule-1");
      await service.createWithSchedule(medication, activeSchedule);
      await repos.doseLogs.create({
        id: "log-1",
        doseOccurrenceId: "dose-1",
        medicationId: medication.id,
        scheduleId: activeSchedule.id,
        action: "taken",
        actionAt: "2026-01-01T08:00:00.000Z",
        snoozedUntil: "",
      });

      await service.remove(medication.id);

      await expect(repos.medications.getById(medication.id)).resolves.toBeNull();
      await expect(repos.schedules.getByMedicationId(medication.id)).resolves.toEqual([]);
      await expect(repos.doseLogs.getByMedicationId(medication.id)).resolves.toEqual([]);
    } finally {
      close();
    }
  });
});
