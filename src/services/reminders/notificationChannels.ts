import notifee, { AndroidImportance } from "@notifee/react-native";
import { Platform } from "react-native";
import { REMINDER_CHANNELS } from "./notificationBuilder";

export async function ensureReminderChannelsCreated(): Promise<void> {
  if (Platform.OS !== "android") return;

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
      id: REMINDER_CHANNELS.alarm,
      name: "Alarmes de dose",
      description: "Alarmes no horário dos medicamentos.",
      importance: AndroidImportance.HIGH,
      sound: "medminder_alarm",
      vibration: true,
      vibrationPattern: [300, 450, 300, 450],
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
