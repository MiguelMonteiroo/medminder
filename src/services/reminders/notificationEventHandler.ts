import notifee, { EventType, type Event } from "@notifee/react-native";
import { createRepositories } from "../../database/db";
import { openAppDatabase } from "../../database/openAppDatabase";
import type { NotificationActionId } from "../../types/domain";
import { createReminderScheduler } from "../reminderScheduler";
import { reconcileNotifications } from "../reminderSyncService";
import {
  processNotificationAction,
  type NotificationActionCommand,
  type NotificationActionDependencies,
} from "./notificationActionHandler";
import { finishActiveAlarm } from "./nativeReminderPermissions";
import { nativeAlarmAudio } from "./nativeAlarmAudio";

async function createDefaultDependencies(): Promise<NotificationActionDependencies> {
  const database = await openAppDatabase();
  const repositories = createRepositories(database);
  const scheduler = createReminderScheduler(repositories.reminderArtifacts);

  return {
    now: () => new Date(),
    getMedication: repositories.medications.getById,
    getSchedule: repositories.schedules.getById,
    getSettings: repositories.settings.get,
    getLogs: repositories.doseLogs.getByDoseOccurrenceId,
    appendLog: repositories.doseLogs.create,
    cancelOccurrence: scheduler.cancelSingle,
    scheduleSnoozed: async (occurrence, medication, schedule, settings) => {
      await scheduler.scheduleForOccurrence(occurrence, medication, schedule, {
        showLockScreenDetails: settings.showLockScreenDetails,
        fullScreenAlarmEnabled: settings.fullScreenAlarmEnabled,
        criticalAlertsEnabled: settings.criticalAlertsEnabled,
        snoozed: true,
        alarmAt: new Date(occurrence.scheduledAt),
      });
    },
    showTakenConfirmation: async (occurrence, medication) => {
      await scheduler.displayTakenConfirmation(occurrence, medication);
    },
    showPending: async (occurrence, medication, settings) => {
      await scheduler.displayPendingNow(
        occurrence,
        medication,
        settings.showLockScreenDetails
      );
    },
    cancelNotification: async (notificationId) => {
      await notifee.cancelNotification(notificationId);
      await nativeAlarmAudio.cancel(notificationId);
    },
  };
}

export async function handleNotifeeEvent(event: Event): Promise<void> {
  if (event.type === EventType.DELIVERED) {
    await reconcileRemindersFromBackground();
    return;
  }

  if (event.type !== EventType.ACTION_PRESS || !event.detail.pressAction) return;

  const notification = event.detail.notification;
  const data = notification?.data;
  const notificationId = notification?.id || "";
  const actionId = event.detail.pressAction.id as NotificationActionId;
  const command: NotificationActionCommand = {
    actionId,
    commandId: `${notificationId}:${actionId}`,
    doseOccurrenceId: String(data?.doseOccurrenceId || ""),
    medicationId: String(data?.medicationId || ""),
    scheduleId: String(data?.scheduleId || ""),
    scheduledAt: String(data?.scheduledAt || ""),
    notificationId,
  };

  await executeDefaultNotificationCommand(command);
  if (
    actionId === "mark-taken" ||
    actionId === "snooze-five" ||
    actionId === "end-alarm-test"
  ) {
    await finishActiveAlarm(notificationId);
  }
}

export async function reconcileRemindersFromBackground(): Promise<void> {
  const database = await openAppDatabase();
  const repositories = createRepositories(database);
  const scheduler = createReminderScheduler(repositories.reminderArtifacts);
  await reconcileNotifications(
    repositories.reminderArtifacts,
    repositories.medications,
    repositories.schedules,
    repositories.settings,
    scheduler
  );
}

export async function executeDefaultNotificationCommand(
  command: NotificationActionCommand
) {
  const dependencies = await createDefaultDependencies();
  return processNotificationAction(command, dependencies);
}
