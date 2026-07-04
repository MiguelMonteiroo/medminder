import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { Platform } from "react-native";

export async function getNotificationPermissionStatus(): Promise<{
  granted: boolean;
}> {
  const settings = await notifee.getNotificationSettings();
  return { granted: settings.authorizationStatus === AuthorizationStatus.AUTHORIZED };
}

export async function requestNotificationPermission(): Promise<{
  granted: boolean;
}> {
  if (Platform.OS === "android") {
    await notifee.createChannel({
      id: "medication-reminders",
      name: "Lembretes de Medicamentos",
      vibration: true,
      vibrationPattern: [250, 250, 250, 250],
    });
  }

  const settings = await notifee.requestPermission();

  return {
    granted: settings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
  };
}
