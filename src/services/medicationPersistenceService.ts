import type { NativeDB } from "../database/nativeDb";
import { createRepositories } from "../database/db";
import type { Medication, MedicationSchedule } from "../types/domain";

export function createMedicationPersistenceService(db: NativeDB) {
  function assertOwnership(
    medication: Medication,
    schedule: MedicationSchedule
  ): void {
    if (schedule.medicationId !== medication.id) {
      throw new Error("Schedule does not belong to medication");
    }
  }

  async function createWithSchedule(
    medication: Medication,
    schedule: MedicationSchedule
  ): Promise<void> {
    assertOwnership(medication, schedule);
    await db.withTransactionAsync(async (transaction) => {
      const repositories = createRepositories(transaction);
      await repositories.medications.create(medication);
      await repositories.schedules.create(schedule);
    });
  }

  async function updateWithSchedule(
    medication: Medication,
    schedule: MedicationSchedule
  ): Promise<void> {
    assertOwnership(medication, schedule);
    await db.withTransactionAsync(async (transaction) => {
      const repositories = createRepositories(transaction);
      const existingSchedule = await repositories.schedules.getById(
        schedule.id
      );
      if (
        existingSchedule &&
        existingSchedule.medicationId !== medication.id
      ) {
        throw new Error("Schedule belongs to another medication");
      }

      await repositories.medications.update(medication);
      await repositories.schedules.deactivateOthers(
        medication.id,
        schedule.id
      );

      if (existingSchedule) {
        await repositories.schedules.update({ ...schedule, isActive: true });
      } else {
        await repositories.schedules.create({ ...schedule, isActive: true });
      }
    });
  }

  async function remove(medicationId: string): Promise<void> {
    await db.withTransactionAsync(async (transaction) => {
      const repositories = createRepositories(transaction);
      await repositories.medications.remove(medicationId);
    });
  }

  return { createWithSchedule, updateWithSchedule, remove };
}

export type MedicationPersistenceService = ReturnType<
  typeof createMedicationPersistenceService
>;
