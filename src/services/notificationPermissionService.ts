import notifee, {
  AndroidNotificationSetting,
  AuthorizationStatus,
} from "@notifee/react-native";
import { Linking, NativeModules, Platform } from "react-native";
import type { ReminderPermissionState } from "../types/domain";
import { ensureReminderChannelsCreated } from "./reminders/notificationChannels";

type ReminderPermissionsNativeModule = {
  canUseFullScreenIntent?: () => Promise<boolean>;
  openFullScreenIntentSettings?: () => Promise<void>;
};

const reminderPermissions = NativeModules.ReminderPermissions as
  | ReminderPermissionsNativeModule
  | undefined;

export async function ensureChannelCreated(): Promise<void> {
  await ensureReminderChannelsCreated();
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
    blocked:
      status !== AuthorizationStatus.AUTHORIZED &&
      status !== AuthorizationStatus.DENIED,
  };
}

export async function requestNotificationPermission(): Promise<{
  granted: boolean;
}> {
  await ensureReminderChannelsCreated();
  const settings = await notifee.requestPermission();
  return {
    granted: settings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
  };
}

export async function getReminderPermissionState(): Promise<ReminderPermissionState> {
  if (Platform.OS !== "android") {
    return {
      notifications: "granted",
      exactAlarms: "notRequired",
      fullScreen: "unsupported",
      batteryOptimization: "unknown",
    };
  }

  const settings = await notifee.getNotificationSettings();
  const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();
  const notifications =
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED
      ? "granted"
      : settings.authorizationStatus === AuthorizationStatus.DENIED
        ? "denied"
        : "blocked";
  const exactAlarms =
    settings.android.alarm === AndroidNotificationSetting.NOT_SUPPORTED
      ? "notRequired"
      : settings.android.alarm === AndroidNotificationSetting.ENABLED
        ? "granted"
        : "denied";

  let fullScreen: ReminderPermissionState["fullScreen"] = "unsupported";
  if (Platform.Version >= 34 && reminderPermissions?.canUseFullScreenIntent) {
    fullScreen = (await reminderPermissions.canUseFullScreenIntent())
      ? "granted"
      : "denied";
  }

  return {
    notifications,
    exactAlarms,
    fullScreen,
    batteryOptimization: batteryOptimizationEnabled
      ? "optimized"
      : "unrestricted",
  };
}

export async function openNotificationSettings(): Promise<void> {
  if (Platform.OS === "android") {
    await notifee.openNotificationSettings();
  } else {
    await Linking.openSettings();
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  await notifee.openAlarmPermissionSettings();
}

export async function openFullScreenAlarmSettings(): Promise<void> {
  if (reminderPermissions?.openFullScreenIntentSettings) {
    await reminderPermissions.openFullScreenIntentSettings();
    return;
  }
  await openNotificationSettings();
}

export async function openBatterySettings(): Promise<void> {
  await notifee.openBatteryOptimizationSettings();
}
