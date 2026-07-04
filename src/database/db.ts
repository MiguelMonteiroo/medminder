import { createMedicationRepository } from "./repositories/medicationRepository";
import { createScheduleRepository } from "./repositories/scheduleRepository";
import { createDoseLogRepository } from "./repositories/doseLogRepository";
import { createNotificationRepository } from "./repositories/notificationRepository";
import { createSettingsRepository } from "./repositories/settingsRepository";
import type { NativeDB } from "./nativeDb";

export function createRepositories(db: NativeDB) {
  return {
    medications: createMedicationRepository(db),
    schedules: createScheduleRepository(db),
    doseLogs: createDoseLogRepository(db),
    notifications: createNotificationRepository(db),
    settings: createSettingsRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
