import notifee, {
  AlarmType,
  AndroidNotificationSetting,
  TriggerType,
} from "@notifee/react-native";
import type {
  DoseOccurrence,
  Medication,
  MedicationSchedule,
  ReminderArtifact,
} from "../types/domain";
import type { ReminderArtifactRepository } from "../database/repositories/reminderArtifactRepository";
import { getReminderPermissionState } from "./notificationPermissionService";
import {
  buildAlarmTestNotification,
  buildDoseAlarmNotification,
  buildPendingNotification,
  buildPreAlertNotification,
  buildReinforcementNotification,
  buildTakenConfirmationNotification,
  type ReminderDoseViewModel,
} from "./reminders/notificationBuilder";
import {
  planOccurrenceReminders,
  type PlannedReminder,
} from "./reminders/reminderPlanner";

export type ReminderScheduleOptions = {
  showLockScreenDetails?: boolean;
  fullScreenAlarmEnabled?: boolean;
  snoozed?: boolean;
  alarmAt?: Date;
};

function doseViewModel(
  occurrence: DoseOccurrence,
  medication: Medication
): ReminderDoseViewModel {
  return {
    occurrenceId: occurrence.id,
    medicationId: occurrence.medicationId,
    scheduleId: occurrence.scheduleId,
    doseWindowKey: occurrence.scheduledAt.slice(0, 16),
    medicationName: medication.name,
    dosage: medication.dosage === "Sem dosagem" ? "" : medication.dosage,
    notes: medication.notes,
    scheduledAt: occurrence.scheduledAt,
  };
}

function artifactNotification(
  plan: PlannedReminder,
  dose: ReminderDoseViewModel,
  options: ReminderScheduleOptions,
  fullScreenAllowed: boolean
) {
  const showDetails = options.showLockScreenDetails ?? false;
  switch (plan.kind) {
    case "preAlert":
      return buildPreAlertNotification(dose, showDetails);
    case "doseAlarm":
    case "snoozedAlarm":
      return buildDoseAlarmNotification(dose, {
        showDetails,
        fullScreenEnabled: fullScreenAllowed,
      });
    case "alarmHandoff":
      return buildPendingNotification(dose, showDetails);
    case "reinforcement":
      return buildReinforcementNotification(dose, showDetails);
    default:
      return buildPendingNotification(dose, showDetails);
  }
}

export function createReminderScheduler(
  artifactRepo: ReminderArtifactRepository
) {
  async function scheduleForOccurrence(
    occurrence: DoseOccurrence,
    medication: Medication,
    _schedule: MedicationSchedule,
    options: ReminderScheduleOptions = {}
  ): Promise<string[]> {
    const permissionState = await getReminderPermissionState();
    if (permissionState.notifications !== "granted") return [];

    const plans = planOccurrenceReminders(occurrence, new Date(), {
      alarmAt: options.alarmAt,
      snoozed: options.snoozed,
    });
    const dose = doseViewModel(occurrence, medication);
    const fullScreenAllowed =
      (options.fullScreenAlarmEnabled ?? false) &&
      permissionState.fullScreen !== "denied";
    const exactAlarmAllowed =
      permissionState.exactAlarms === "granted" ||
      permissionState.exactAlarms === "notRequired";
    const notificationIds: string[] = [];

    for (const plan of plans) {
      const isWindowPreAlert = plan.kind === "preAlert";
      const artifactId = isWindowPreAlert
        ? `pre-alert:${plan.doseWindowKey}`
        : `${occurrence.id}:${plan.kind}:${plan.scheduledFor}`;
      const notification = artifactNotification(
        plan,
        dose,
        options,
        fullScreenAllowed
      );
      if (isWindowPreAlert) {
        const windowArtifacts = await artifactRepo.getByWindowKey(
          plan.doseWindowKey
        );
        const existingDoseCount = new Set(
          windowArtifacts
            .filter(
              (artifact) =>
                artifact.kind === "doseAlarm" ||
                artifact.kind === "snoozedAlarm"
            )
            .map((artifact) => artifact.doseOccurrenceId)
        ).size;
        const doseCount = existingDoseCount + 1;
        if (doseCount > 1) {
          notification.title = `${doseCount} medicamentos em 5 minutos`;
          notification.body = "Abra o MedMinder para conferir as próximas doses.";
        }
      }
      notification.id = artifactId;

      const scheduledAt = new Date(plan.scheduledFor);
      if (scheduledAt.getTime() <= Date.now()) continue;

      const notificationId = await notifee.createTriggerNotification(
        notification,
        {
          type: TriggerType.TIMESTAMP,
          timestamp: scheduledAt.getTime(),
          ...(exactAlarmAllowed
            ? {
                alarmManager: {
                  type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
                },
              }
            : {}),
        }
      );

      const artifact: ReminderArtifact = {
        id: artifactId,
        kind: plan.kind,
        notificationId,
        doseOccurrenceId: occurrence.id,
        medicationId: occurrence.medicationId,
        scheduleId: occurrence.scheduleId,
        doseWindowKey: plan.doseWindowKey,
        scheduledFor: plan.scheduledFor,
        expiresAt: plan.expiresAt,
        createdAt: new Date().toISOString(),
      };
      await artifactRepo.create(artifact);
      notificationIds.push(notificationId);
    }

    return notificationIds;
  }

  async function cancelSingle(occurrenceId: string): Promise<void> {
    const artifacts = await artifactRepo.getByDoseOccurrenceId(occurrenceId);
    for (const artifact of artifacts) {
      if (artifact.kind === "preAlert") {
        const windowArtifacts = await artifactRepo.getByWindowKey(
          artifact.doseWindowKey
        );
        const hasAnotherDose = windowArtifacts.some(
          (candidate) =>
            candidate.doseOccurrenceId !== occurrenceId &&
            (candidate.kind === "doseAlarm" ||
              candidate.kind === "snoozedAlarm")
        );
        if (hasAnotherDose) continue;
      }
      await notifee.cancelNotification(artifact.notificationId);
      await artifactRepo.remove(artifact.id);
    }
  }

  async function cancelForMedication(medicationId: string): Promise<void> {
    const artifacts = await artifactRepo.getByMedicationId(medicationId);
    for (const artifact of artifacts) {
      if (artifact.kind === "preAlert") {
        const windowArtifacts = await artifactRepo.getByWindowKey(
          artifact.doseWindowKey
        );
        const hasAnotherMedication = windowArtifacts.some(
          (candidate) =>
            candidate.medicationId !== medicationId &&
            (candidate.kind === "doseAlarm" ||
              candidate.kind === "snoozedAlarm")
        );
        if (hasAnotherMedication) continue;
      }
      await notifee.cancelNotification(artifact.notificationId);
      await artifactRepo.remove(artifact.id);
    }
  }

  async function cancelAll(): Promise<void> {
    await notifee.cancelAllNotifications();
    await artifactRepo.removeAll();
  }

  async function displayTakenConfirmation(
    occurrence: DoseOccurrence,
    medication: Medication
  ): Promise<string> {
    const notification = buildTakenConfirmationNotification(
      doseViewModel(occurrence, medication)
    );
    return notifee.displayNotification(notification);
  }

  async function displayPendingNow(
    occurrence: DoseOccurrence,
    medication: Medication,
    showDetails: boolean
  ): Promise<string> {
    return notifee.displayNotification(
      buildPendingNotification(doseViewModel(occurrence, medication), showDetails)
    );
  }

  async function runAlarmTest(): Promise<string> {
    const settings = await notifee.getNotificationSettings();
    const exact =
      settings.android.alarm === AndroidNotificationSetting.ENABLED ||
      settings.android.alarm === AndroidNotificationSetting.NOT_SUPPORTED;
    const timestamp = Date.now() + 5_000;
    return notifee.createTriggerNotification(buildAlarmTestNotification(), {
      type: TriggerType.TIMESTAMP,
      timestamp,
      ...(exact
        ? { alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE } }
        : {}),
    });
  }

  return {
    scheduleForOccurrence,
    cancelSingle,
    cancelForMedication,
    cancelAll,
    displayTakenConfirmation,
    displayPendingNow,
    runAlarmTest,
  };
}

export type ReminderScheduler = ReturnType<typeof createReminderScheduler>;
