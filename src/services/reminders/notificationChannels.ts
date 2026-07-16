import notifee, { AndroidImportance } from "@notifee/react-native";
import { Platform } from "react-native";
import { REMINDER_CHANNELS } from "./notificationBuilder";
import { reminderPermissionsNative } from "./nativeReminderPermissions";

export async function ensureReminderChannelsCreated(): Promise<void> {
  if (Platform.OS !== "android") return;
  if (!reminderPermissionsNative?.ensureAlarmChannels) {
    throw new Error("Native alarm channel support is unavailable.");
  }

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
