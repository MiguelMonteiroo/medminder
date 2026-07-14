import notifee from "@notifee/react-native";
import type { ReminderArtifactRepository } from "../database/repositories/reminderArtifactRepository";
import type { MedicationRepository } from "../database/repositories/medicationRepository";
import type { ScheduleRepository } from "../database/repositories/scheduleRepository";
import type { SettingsRepository } from "../database/repositories/settingsRepository";
import { generateDoseOccurrencesForDate } from "../utils/doseEngine";
import type { ReminderScheduler } from "./reminderScheduler";
import { getNotificationPermissionStatus } from "./notificationPermissionService";
import { planOccurrenceReminders } from "./reminders/reminderPlanner";
import type { PlannedReminder } from "./reminders/reminderPlanner";
import type { ReminderArtifact } from "../types/domain";

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

export function reminderArtifactsMatchPlans(
  artifacts: ReminderArtifact[],
  plans: PlannedReminder[]
): boolean {
  const plansByKind = new Map(plans.map((plan) => [plan.kind, plan]));
  return artifacts.every((artifact) => {
    const plan = plansByKind.get(artifact.kind);
    if (!plan) return false;
    return (
      new Date(artifact.scheduledFor).getTime() ===
      new Date(plan.scheduledFor).getTime()
    );
  });
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
  const now = Date.now();
  const staleBefore = now - 15 * 60 * 1000;
  let removed = 0;

  for (const artifact of storedArtifacts) {
    const scheduledAt = new Date(artifact.scheduledFor).getTime();
    const missingNativeTrigger = !activeIds.has(artifact.notificationId);
    const shouldRemoveMissingArtifact =
      missingNativeTrigger &&
      (scheduledAt > now || scheduledAt < staleBefore);

    if (shouldRemoveMissingArtifact) {
      await artifactRepo.remove(artifact.id);
      removed++;
    }
  }

  if (!granted || !settings.notificationsEnabled) {
    return { removed, recreated: 0 };
  }

  const medications = await medicationRepo.getAll();
  const schedules = await scheduleRepo.getAll();
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
        let artifacts = await artifactRepo.getByDoseOccurrenceId(occurrence.id);
        const expectedPlans = planOccurrenceReminders(occurrence);
        if (!reminderArtifactsMatchPlans(artifacts, expectedPlans)) {
          await reminderScheduler.cancelSingle(occurrence.id);
          artifacts = [];
        }
        const windowArtifacts = await artifactRepo.getByWindowKey(
          occurrence.scheduledAt.slice(0, 16)
        );
        const expectedKinds = expectedPlans.map((plan) => plan.kind);
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
