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
import { shouldUseCriticalAlarmChannel } from "./reminders/alarmChannelSelection";
import {
  nativeAlarmAudio,
  type AlarmAudioController,
  type NativeAlarmPayload,
} from "./reminders/nativeAlarmAudio";
import {
  planOccurrenceReminders,
  type PlannedReminder,
} from "./reminders/reminderPlanner";

export type ReminderScheduleOptions = {
  showLockScreenDetails?: boolean;
  fullScreenAlarmEnabled?: boolean;
  criticalAlertsEnabled?: boolean;
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
  fullScreenAllowed: boolean,
  useCriticalChannel: boolean,
  useNativeAudio: boolean
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
        useCriticalChannel,
        useNativeAudio,
      });
    case "alarmHandoff":
      return buildPendingNotification(dose, showDetails);
    case "reinforcement":
      return buildReinforcementNotification(
        dose,
        showDetails,
        useCriticalChannel
      );
    default:
      return buildPendingNotification(dose, showDetails);
  }
}

function nativeAlarmPayload(
  alarmId: string,
  artifactKind: "doseAlarm" | "snoozedAlarm" | "alarmTest",
  dose: ReminderDoseViewModel | null,
  options: {
    showDetails: boolean;
    fullScreenEnabled: boolean;
    useCriticalChannel: boolean;
    scheduledAt: string;
  }
): NativeAlarmPayload {
  const title = dose
    ? options.showDetails
      ? dose.medicationName
      : "Hora do medicamento"
    : "Teste de alarme";
  const description = dose
    ? [dose.dosage, dose.notes].filter(Boolean).join(" · ") ||
      "Dose agendada agora."
    : "Som, vibração e tela cheia estão sendo testados.";

  return {
    alarmId,
    artifactKind,
    title,
    body:
      dose && !options.showDetails
        ? "Desbloqueie o aparelho para ver os detalhes."
        : description,
    doseOccurrenceId: dose?.occurrenceId ?? "",
    medicationId: dose?.medicationId ?? "",
    scheduleId: dose?.scheduleId ?? "",
    scheduledAt: options.scheduledAt,
    doseWindowKey: dose?.doseWindowKey ?? "",
    showDetails: options.showDetails,
    fullScreenEnabled: options.fullScreenEnabled,
    criticalAlertsEnabled: options.useCriticalChannel,
  };
}

export function createReminderScheduler(
  artifactRepo: ReminderArtifactRepository,
  alarmAudio: AlarmAudioController = nativeAlarmAudio
) {
  async function cancelArtifact(artifact: ReminderArtifact): Promise<void> {
    if (artifact.notificationId.startsWith("native:")) {
      await alarmAudio.cancel(artifact.notificationId);
      return;
    }
    await notifee.cancelNotification(artifact.notificationId);
    // Compatibility with alarms created before transport-specific IDs existed.
    await alarmAudio.cancel(artifact.id);
  }

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
    const useCriticalChannel = shouldUseCriticalAlarmChannel(
      options.criticalAlertsEnabled ?? false,
      permissionState.doNotDisturb,
      permissionState.criticalAlarmChannel
    );
    const exactAlarmAllowed =
      permissionState.exactAlarms === "granted" ||
      permissionState.exactAlarms === "notRequired";
    const notificationIds: string[] = [];
    const schedulingStartedAt = Date.now();

    for (const plan of plans) {
      const isWindowPreAlert = plan.kind === "preAlert";
      const artifactId = isWindowPreAlert
        ? `pre-alert:${plan.doseWindowKey}`
        : `${occurrence.id}:${plan.kind}:${plan.scheduledFor}`;
      const nativeAlarmId = `native:${artifactId}`;
      const scheduledAt = new Date(plan.scheduledFor);
      const isImmediatePreAlert =
        isWindowPreAlert && scheduledAt.getTime() <= schedulingStartedAt;
      if (scheduledAt.getTime() <= schedulingStartedAt && !isImmediatePreAlert) {
        continue;
      }
      const isAudioAlarm =
        plan.kind === "doseAlarm" || plan.kind === "snoozedAlarm";
      const nativeArtifactKind =
        plan.kind === "snoozedAlarm" ? "snoozedAlarm" : "doseAlarm";
      let nativeAudioScheduled = false;
      if (isAudioAlarm && exactAlarmAllowed && alarmAudio.available) {
        try {
          nativeAudioScheduled = await alarmAudio.schedule(
            nativeAlarmId,
            scheduledAt.getTime(),
            60_000,
            nativeAlarmPayload(nativeAlarmId, nativeArtifactKind, dose, {
              showDetails: options.showLockScreenDetails ?? false,
              fullScreenEnabled: fullScreenAllowed,
              useCriticalChannel,
              scheduledAt: plan.scheduledFor,
            })
          );
        } catch {
          nativeAudioScheduled = false;
        }
      }
      const notification = nativeAudioScheduled
        ? null
        : artifactNotification(
            plan,
            dose,
            options,
            fullScreenAllowed,
            useCriticalChannel,
            false
          );
      if (isWindowPreAlert && notification) {
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
          notification.body = "Abra o Remedin para conferir as próximas doses.";
        }
      }
      if (notification) notification.id = artifactId;

      let notificationId: string;
      if (nativeAudioScheduled) {
        notificationId = nativeAlarmId;
      } else if (isImmediatePreAlert) {
        notificationId = await notifee.displayNotification(notification!);
      } else {
        try {
          notificationId = await notifee.createTriggerNotification(
            notification!,
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
        } catch (error) {
          throw error;
        }
      }

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
      try {
        await artifactRepo.create(artifact);
      } catch (error) {
        await Promise.allSettled([
          nativeAudioScheduled
            ? Promise.resolve()
            : notifee.cancelNotification(notificationId),
          alarmAudio.cancel(nativeAlarmId),
        ]);
        throw error;
      }
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
      await cancelArtifact(artifact);
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
      await cancelArtifact(artifact);
      await artifactRepo.remove(artifact.id);
    }
  }

  async function cancelAll(): Promise<void> {
    await notifee.cancelAllNotifications();
    await alarmAudio.cancelAll();
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

  async function runAlarmTest(options: {
    criticalAlertsEnabled: boolean;
    fullScreenAlarmEnabled: boolean;
  }): Promise<string> {
    const settings = await notifee.getNotificationSettings();
    const permissionState = await getReminderPermissionState();
    const exact =
      settings.android.alarm === AndroidNotificationSetting.ENABLED ||
      settings.android.alarm === AndroidNotificationSetting.NOT_SUPPORTED;
    const timestamp = Date.now() + 5_000;
    const testId = `alarm-test:${timestamp}`;
    const alarmId = `native:${testId}`;
    let nativeAudioScheduled = false;
    if (exact && alarmAudio.available) {
      try {
        nativeAudioScheduled = await alarmAudio.schedule(
          alarmId,
          timestamp,
          10_000,
          nativeAlarmPayload(alarmId, "alarmTest", null, {
            showDetails: true,
            fullScreenEnabled:
              options.fullScreenAlarmEnabled &&
              permissionState.fullScreen !== "denied",
            useCriticalChannel: shouldUseCriticalAlarmChannel(
              options.criticalAlertsEnabled,
              permissionState.doNotDisturb,
              permissionState.criticalAlarmChannel
            ),
            scheduledAt: new Date(timestamp).toISOString(),
          })
        );
      } catch {
        nativeAudioScheduled = false;
      }
    }
    if (nativeAudioScheduled) return alarmId;
    const notification = buildAlarmTestNotification({
      fullScreenEnabled:
        options.fullScreenAlarmEnabled &&
        permissionState.fullScreen !== "denied",
      useCriticalChannel: shouldUseCriticalAlarmChannel(
        options.criticalAlertsEnabled,
        permissionState.doNotDisturb,
        permissionState.criticalAlarmChannel
      ),
      useNativeAudio: false,
    });
    notification.id = testId;
    try {
      return await notifee.createTriggerNotification(notification, {
        type: TriggerType.TIMESTAMP,
        timestamp,
        ...(exact
          ? { alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE } }
          : {}),
      });
    } catch (error) {
      throw error;
    }
  }

  async function getScheduledNativeAlarmIds(): Promise<string[]> {
    return alarmAudio.getScheduledIds();
  }

  return {
    scheduleForOccurrence,
    cancelSingle,
    cancelForMedication,
    cancelAll,
    displayTakenConfirmation,
    displayPendingNow,
    runAlarmTest,
    getScheduledNativeAlarmIds,
  };
}

export type ReminderScheduler = ReturnType<typeof createReminderScheduler>;
