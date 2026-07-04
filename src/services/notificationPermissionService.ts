import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function getNotificationPermissionStatus(): Promise<{
  granted: boolean;
}> {
  const settings = await Notifications.getPermissionsAsync();
  return { granted: settings.granted };
}

export async function requestNotificationPermission(): Promise<{
  granted: boolean;
}> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("medication-reminders", {
      name: "Lembretes de Medicamentos",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const settings = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return { granted: settings.granted };
}
