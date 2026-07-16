import { NativeModules } from "react-native";

export type ReminderPermissionsNativeModule = {
  canUseFullScreenIntent?: () => Promise<boolean>;
  openFullScreenIntentSettings?: () => Promise<void>;
  isNotificationPolicyAccessGranted?: () => Promise<boolean>;
  openNotificationPolicySettings?: () => Promise<void>;
  ensureAlarmChannels?: () => Promise<void>;
  finishDoseAlarmActivity?: () => Promise<void>;
};

export const reminderPermissionsNative = NativeModules.ReminderPermissions as
  | ReminderPermissionsNativeModule
  | undefined;

export async function finishDoseAlarmActivityIfOpen(): Promise<void> {
  await reminderPermissionsNative?.finishDoseAlarmActivity?.();
}
