import { NativeModules } from "react-native";

export type ReminderPermissionsNativeModule = {
  canUseFullScreenIntent?: () => Promise<boolean>;
  openFullScreenIntentSettings?: () => Promise<void>;
  isNotificationPolicyAccessGranted?: () => Promise<boolean>;
  openNotificationPolicySettings?: () => Promise<void>;
  ensureAlarmChannels?: () => Promise<void>;
};

export const reminderPermissionsNative = NativeModules.ReminderPermissions as
  | ReminderPermissionsNativeModule
  | undefined;
