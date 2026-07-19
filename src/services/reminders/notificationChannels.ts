import notifee, { AndroidImportance } from "@notifee/react-native";
import { Platform } from "react-native";
import { REMINDER_CHANNELS } from "./notificationBuilder";
import { reminderPermissionsNative } from "./nativeReminderPermissions";

const LEGACY_ALARM_CHANNEL_IDS = [
  "medication-dose-alarms-v2",
  "medication-dose-alarms-critical-v2",
] as const;

async function removeLegacyAlarmChannels(): Promise<void> {
  const triggers = await notifee.getTriggerNotifications();
  const legacyTriggers = triggers.filter((trigger) =>
    LEGACY_ALARM_CHANNEL_IDS.includes(
      trigger.notification.android?.channelId as (typeof LEGACY_ALARM_CHANNEL_IDS)[number]
    )
  );

  await Promise.all(
    legacyTriggers.map((trigger) =>
      trigger.notification.id
        ? notifee.cancelNotification(trigger.notification.id)
        : Promise.resolve()
    )
  );
  await Promise.all(
    LEGACY_ALARM_CHANNEL_IDS.map((channelId) => notifee.deleteChannel(channelId))
  );
}

export async function ensureReminderChannelsCreated(): Promise<void> {
  if (Platform.OS !== "android") return;
  if (!reminderPermissionsNative?.ensureAlarmChannels) {
    throw new Error("Native alarm channel support is unavailable.");
  }

  await removeLegacyAlarmChannels();
  await reminderPermissionsNative.ensureAlarmChannels();
  await Promise.all([
    notifee.createChannel({
      id: REMINDER_CHANNELS.preAlert,
      name: "Avisos antecipados",
      description: "Avisos suaves cinco minutos antes dos medicamentos.",
      importance: AndroidImportance.DEFAULT,
      sound: "medminder_pre_alert",
      vibration: false,
    }),
    notifee.createChannel({
      id: REMINDER_CHANNELS.pending,
      name: "Doses pendentes",
      description: "Lembretes persistentes de doses ainda não registradas.",
      importance: AndroidImportance.DEFAULT,
      vibration: false,
    }),
    notifee.createChannel({
      id: REMINDER_CHANNELS.status,
      name: "Confirmações de dose",
      description: "Confirmações silenciosas das ações registradas.",
      importance: AndroidImportance.LOW,
      vibration: false,
    }),
  ]);
}
