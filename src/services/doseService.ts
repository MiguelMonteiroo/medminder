import { DoseLog, DoseAction } from "../types/domain";
import { DoseLogRepository } from "../database/repositories/doseLogRepository";

export function createDoseService(doseLogRepo: DoseLogRepository) {
  async function markDoseTaken(
    doseOccurrenceId: string,
    medicationId: string,
    scheduleId: string,
    actionAt: string
  ): Promise<void> {
    const log: DoseLog = {
      id: `${doseOccurrenceId}-${actionAt}`,
      doseOccurrenceId,
      medicationId,
      scheduleId,
      action: "taken",
      actionAt,
      snoozedUntil: "",
    };
    await doseLogRepo.create(log);
  }

  async function undoDoseAction(
    doseOccurrenceId: string,
    medicationId: string,
    scheduleId: string,
    actionAt: string
  ): Promise<void> {
    const log: DoseLog = {
      id: `${doseOccurrenceId}-undo-${actionAt}`,
      doseOccurrenceId,
      medicationId,
      scheduleId,
      action: "undone",
      actionAt,
      snoozedUntil: "",
    };
    await doseLogRepo.create(log);
  }

  async function skipDose(
    doseOccurrenceId: string,
    medicationId: string,
    scheduleId: string,
    actionAt: string
  ): Promise<void> {
    const log: DoseLog = {
      id: `${doseOccurrenceId}-skip-${actionAt}`,
      doseOccurrenceId,
      medicationId,
      scheduleId,
      action: "skipped",
      actionAt,
      snoozedUntil: "",
    };
    await doseLogRepo.create(log);
  }

  async function snoozeDose(
    doseOccurrenceId: string,
    medicationId: string,
    scheduleId: string,
    actionAt: string,
    snoozedUntil: string
  ): Promise<void> {
    const log: DoseLog = {
      id: `${doseOccurrenceId}-snooze-${actionAt}`,
      doseOccurrenceId,
      medicationId,
      scheduleId,
      action: "snoozed",
      actionAt,
      snoozedUntil,
    };
    await doseLogRepo.create(log);
  }

  return { markDoseTaken, undoDoseAction, skipDose, snoozeDose };
}

export type DoseService = ReturnType<typeof createDoseService>;
