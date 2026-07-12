import notifee from "@notifee/react-native";
import type { ReminderArtifactRepository } from "../database/repositories/reminderArtifactRepository";
import type { MedicationRepository } from "../database/repositories/medicationRepository";
import type { ScheduleRepository } from "../database/repositories/scheduleRepository";
import type { SettingsRepository } from "../database/repositories/settingsRepository";
import { generateDoseOccurrencesForDate } from "../utils/doseEngine";
import type { ReminderScheduler } from "./reminderScheduler";
import { getNotificationPermissionStatus } from "./notificationPermissionService";
import { planOccurrenceReminders } from "./reminders/reminderPlanner";

function formatDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function reconcileNotifications(
  artifactRepo: ReminderArtifactRepository,
  medicationRepo: MedicationRepository,
  scheduleRepo: ScheduleRepository,
  settingsRepo: SettingsRepository,
  reminderScheduler: ReminderScheduler
): Promise<{ removed: number; recreated: number }> {
  const { granted } = await getNotificationPermissionStatus();
  const settings = await settingsRepo.get();
  const activeIds = new Set(await notifee.getTriggerNotificationIds());
  const storedArtifacts = await artifactRepo.getAll();
  const staleBefore = Date.now() - 15 * 60 * 1000;
  let removed = 0;

  for (const artifact of storedArtifacts) {
    if (
      !activeIds.has(artifact.notificationId) &&
      new Date(artifact.scheduledFor).getTime() < staleBefore
    ) {
      await artifactRepo.remove(artifact.id);
      removed++;
    }
  }

  if (!granted || !settings.notificationsEnabled) {
    return { removed, recreated: 0 };
  }

  const medications = await medicationRepo.getAll();
  const schedules = await scheduleRepo.getAll();
  const now = Date.now();
  const horizon = now + 48 * 60 * 60 * 1000;
  let recreated = 0;

  for (const medication of medications) {
    if (medication.isPaused) continue;
    const medicationSchedules = schedules.filter(
      (schedule) => schedule.medicationId === medication.id && schedule.isActive
    );

    for (const schedule of medicationSchedules) {
      const occurrences = Array.from({ length: 3 }, (_, index) =>
        generateDoseOccurrencesForDate(
          medication,
          schedule,
          formatDateString(addDays(new Date(), index))
        )
      )
        .flat()
        .filter((occurrence) => {
          const timestamp = new Date(occurrence.scheduledAt).getTime();
          return timestamp > now && timestamp <= horizon;
        });

      for (const occurrence of occurrences) {
        const artifacts = await artifactRepo.getByDoseOccurrenceId(occurrence.id);
        const windowArtifacts = await artifactRepo.getByWindowKey(
          occurrence.scheduledAt.slice(0, 16)
        );
        const expectedKinds = planOccurrenceReminders(occurrence).map(
          (plan) => plan.kind
        );
        const existingKinds = new Set(artifacts.map((artifact) => artifact.kind));
        if (windowArtifacts.some((artifact) => artifact.kind === "preAlert")) {
          existingKinds.add("preAlert");
        }
        if (expectedKinds.every((kind) => existingKinds.has(kind))) continue;
        if (artifacts.length > 0) {
          await reminderScheduler.cancelSingle(occurrence.id);
        }
        const ids = await reminderScheduler.scheduleForOccurrence(
          occurrence,
          medication,
          schedule,
          {
            showLockScreenDetails: settings.showLockScreenDetails,
            fullScreenAlarmEnabled: settings.fullScreenAlarmEnabled,
          }
        );
        recreated += ids.length;
      }
    }
  }

  return { removed, recreated };
}

export async function getActiveNotificationCount(
  artifactRepo: ReminderArtifactRepository
): Promise<number> {
  return (await artifactRepo.getAll()).length;
}
