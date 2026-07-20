import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from "@notifee/react-native";
import { Platform } from "react-native";
import { REMINDER_CHANNELS } from "./notificationBuilder";
import { reminderPermissionsNative } from "./nativeReminderPermissions";

const LEGACY_ALARM_CHANNEL_IDS = [
  "medication-dose-alarms-v2",
  "medication-dose-alarms-critical-v2",
] as const;
const LEGACY_PRE_ALERT_CHANNEL_IDS = [
  "medication-pre-alerts-v1",
  "medication-pre-alerts-v2",
  "medication-pre-alerts-v3",
] as const;
const LEGACY_CHANNEL_IDS = [
  ...LEGACY_ALARM_CHANNEL_IDS,
  ...LEGACY_PRE_ALERT_CHANNEL_IDS,
] as const;

async function removeLegacyChannels(): Promise<void> {
  const [triggers, displayed] = await Promise.all([
    notifee.getTriggerNotifications(),
    notifee.getDisplayedNotifications(),
  ]);
  const legacyNotificationIds = new Set(
    [...triggers, ...displayed]
      .filter((item) =>
        LEGACY_CHANNEL_IDS.includes(
          item.notification.android?.channelId as (typeof LEGACY_CHANNEL_IDS)[number]
        )
      )
      .map((item) => item.notification.id)
      .filter((id): id is string => Boolean(id))
  );

  await Promise.all(
    [...legacyNotificationIds].map((id) => notifee.cancelNotification(id))
  );
  await Promise.all(
    LEGACY_CHANNEL_IDS.map((channelId) => notifee.deleteChannel(channelId))
  );
}

export async function ensureReminderChannelsCreated(): Promise<void> {
  if (Platform.OS !== "android") return;
  if (!reminderPermissionsNative?.ensureAlarmChannels) {
    throw new Error("Native alarm channel support is unavailable.");
  }

  await removeLegacyChannels();
  await reminderPermissionsNative.ensureAlarmChannels();
  await Promise.all([
    notifee.createChannel({
      id: REMINDER_CHANNELS.preAlert,
      name: "Avisos antecipados",
      description: "Avisos suaves cinco minutos antes dos medicamentos.",
      importance: AndroidImportance.DEFAULT,
      vibration: false,
      visibility: AndroidVisibility.PUBLIC,
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
