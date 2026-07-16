import {
  AndroidCategory,
  AndroidVisibility,
  type Notification,
} from "@notifee/react-native";

export const REMINDER_CHANNELS = {
  preAlert: "medication-pre-alerts-v1",
  alarm: "medication-dose-alarms-v2",
  criticalAlarm: "medication-dose-alarms-critical-v2",
  pending: "medication-pending-v1",
  status: "medication-dose-status-v1",
} as const;

export type ReminderDoseViewModel = {
  occurrenceId: string;
  medicationId: string;
  scheduleId: string;
  doseWindowKey: string;
  medicationName: string;
  dosage: string;
  notes: string;
  scheduledAt: string;
};

type AlarmOptions = {
  showDetails: boolean;
  fullScreenEnabled: boolean;
  useCriticalChannel: boolean;
};

const DOSE_ALARM_ACTIVITY = "com.medminder.DoseAlarmActivity";

function alarmChannel(useCriticalChannel: boolean): string {
  return useCriticalChannel
    ? REMINDER_CHANNELS.criticalAlarm
    : REMINDER_CHANNELS.alarm;
}

function reminderData(dose: ReminderDoseViewModel, artifactKind: string) {
  return {
    payloadVersion: "1",
    artifactKind,
    doseOccurrenceId: dose.occurrenceId,
    medicationId: dose.medicationId,
    scheduleId: dose.scheduleId,
    doseWindowKey: dose.doseWindowKey,
    scheduledAt: dose.scheduledAt,
  };
}

function doseDescription(dose: ReminderDoseViewModel): string {
  const parts = [dose.dosage, dose.notes].filter(Boolean);
  return parts.join(" · ");
}

function doseActions(showDetails: boolean) {
  return [
    showDetails
      ? {
          title: "Marcar como tomado",
          pressAction: { id: "mark-taken" },
        }
      : {
          title: "Ver medicamento",
          pressAction: { id: "open-dose-window", launchActivity: "default" },
        },
    {
      title: "Adiar 5 min",
      pressAction: { id: "snooze-five" },
    },
  ];
}

export function buildPreAlertNotification(
  dose: ReminderDoseViewModel,
  showDetails: boolean
): Notification {
  return {
    title: showDetails
      ? `${dose.medicationName} em 5 minutos`
      : "Medicamento em 5 minutos",
    body: showDetails
      ? doseDescription(dose) || "Prepare sua próxima dose."
      : "Abra o MedMinder para ver os detalhes.",
    data: reminderData(dose, "preAlert"),
    android: {
      channelId: REMINDER_CHANNELS.preAlert,
      category: AndroidCategory.REMINDER,
      visibility: showDetails
        ? AndroidVisibility.PUBLIC
        : AndroidVisibility.PRIVATE,
      pressAction: {
        id: "open-dose-window",
        launchActivity: "default",
      },
    },
  };
}

export function buildDoseAlarmNotification(
  dose: ReminderDoseViewModel,
  options: AlarmOptions
): Notification {
  return {
    title: options.showDetails ? dose.medicationName : "Hora do medicamento",
    body: options.showDetails
      ? doseDescription(dose) || "Dose agendada agora."
      : "Desbloqueie o aparelho para ver os detalhes.",
    data: {
      ...reminderData(dose, "doseAlarm"),
      showDetails: String(options.showDetails),
    },
    android: {
      channelId: alarmChannel(options.useCriticalChannel),
      category: AndroidCategory.ALARM,
      visibility: options.showDetails
        ? AndroidVisibility.PUBLIC
        : AndroidVisibility.PRIVATE,
      autoCancel: false,
      ongoing: true,
      loopSound: true,
      lightUpScreen: true,
      timeoutAfter: 60_000,
      pressAction: {
        id: "open-dose-window",
        launchActivity: DOSE_ALARM_ACTIVITY,
      },
      fullScreenAction: options.fullScreenEnabled
        ? {
            id: "dose-alarm",
            launchActivity: DOSE_ALARM_ACTIVITY,
          }
        : undefined,
      actions: doseActions(options.showDetails),
    },
  };
}

export function buildPendingNotification(
  dose: ReminderDoseViewModel,
  showDetails: boolean
): Notification {
  return {
    title: showDetails ? `${dose.medicationName} continua pendente` : "Dose pendente",
    body: showDetails ? doseDescription(dose) : "Abra o MedMinder para ver os detalhes.",
    data: reminderData(dose, "alarmHandoff"),
    android: {
      channelId: REMINDER_CHANNELS.pending,
      category: AndroidCategory.REMINDER,
      autoCancel: false,
      ongoing: true,
      pressAction: { id: "open-dose-window", launchActivity: "default" },
      actions: doseActions(showDetails),
    },
  };
}

export function buildReinforcementNotification(
  dose: ReminderDoseViewModel,
  showDetails: boolean,
  useCriticalChannel = false
): Notification {
  const notification = buildPendingNotification(dose, showDetails);
  return {
    ...notification,
    title: showDetails ? `${dose.medicationName} ainda está pendente` : "Dose ainda pendente",
    data: reminderData(dose, "reinforcement"),
    android: {
      ...notification.android!,
      channelId: alarmChannel(useCriticalChannel),
      ongoing: false,
      loopSound: false,
    },
  };
}

export function buildTakenConfirmationNotification(
  dose: ReminderDoseViewModel
): Notification {
  return {
    title: "Dose registrada como tomada",
    body: dose.medicationName,
    data: reminderData(dose, "takenConfirmation"),
    android: {
      channelId: REMINDER_CHANNELS.status,
      category: AndroidCategory.STATUS,
      timeoutAfter: 10 * 60_000,
      actions: [
        {
          title: "Desfazer",
          pressAction: { id: "undo-taken" },
        },
      ],
    },
  };
}

export function buildAlarmTestNotification(options: {
  fullScreenEnabled: boolean;
  useCriticalChannel: boolean;
}): Notification {
  return {
    title: "Teste de alarme",
    body: "Som, vibração e tela cheia estão sendo testados.",
    data: { payloadVersion: "1", artifactKind: "alarmTest" },
    android: {
      channelId: alarmChannel(options.useCriticalChannel),
      category: AndroidCategory.ALARM,
      loopSound: true,
      lightUpScreen: true,
      timeoutAfter: 10_000,
      pressAction: {
        id: "alarm-test",
        launchActivity: DOSE_ALARM_ACTIVITY,
      },
      fullScreenAction: options.fullScreenEnabled
        ? {
            id: "alarm-test",
            launchActivity: DOSE_ALARM_ACTIVITY,
          }
        : undefined,
      actions: [
        {
          title: "Encerrar teste",
          pressAction: { id: "end-alarm-test" },
        },
      ],
    },
  };
}
