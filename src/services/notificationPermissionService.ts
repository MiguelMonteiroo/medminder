import notifee, { AuthorizationStatus, AndroidImportance } from "@notifee/react-native";
import { Platform, Linking } from "react-native";

const CHANNEL_ID = "medication-reminders";

export async function ensureChannelCreated(): Promise<void> {
  if (Platform.OS !== "android") return;

  await notifee.createChannel({
    id: CHANNEL_ID,
    name: "Lembretes de Medicamentos",
    description: "Lembretes para tomar seus medicamentos no horário certo.",
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [250, 500, 250, 500],
  });
}

export async function getNotificationPermissionStatus(): Promise<{
  granted: boolean;
  denied: boolean;
  blocked: boolean;
}> {
  if (Platform.OS !== "android") {
    return { granted: true, denied: false, blocked: false };
  }

  const settings = await notifee.getNotificationSettings();
  const status = settings.authorizationStatus;

  return {
    granted: status === AuthorizationStatus.AUTHORIZED,
    denied: status === AuthorizationStatus.DENIED,
    blocked: false,
  };
}

export async function requestNotificationPermission(): Promise<{
  granted: boolean;
}> {
  if (Platform.OS === "android") {
    await ensureChannelCreated();
  }

  const settings = await notifee.requestPermission();

  return {
    granted: settings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
  };
}

export async function openNotificationSettings(): Promise<void> {
  if (Platform.OS === "android") {
    await notifee.openNotificationSettings();
  } else {
    await Linking.openSettings();
  }
}
