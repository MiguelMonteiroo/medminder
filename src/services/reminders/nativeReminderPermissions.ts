import { NativeModules } from "react-native";
import type { DoseAlarmPayload } from "./alarmPayloadLoader";
import type { AlarmPresentationDiagnostics } from "./alarmPresentationDiagnostics";

export type ReminderPermissionsNativeModule = {
  canUseFullScreenIntent?: () => Promise<boolean>;
  openFullScreenIntentSettings?: () => Promise<void>;
  isNotificationPolicyAccessGranted?: () => Promise<boolean>;
  isCriticalAlarmChannelBypassingDnd?: () => Promise<boolean>;
  openNotificationPolicySettings?: () => Promise<void>;
  openCriticalAlarmChannelSettings?: () => Promise<void>;
  ensureAlarmChannels?: () => Promise<void>;
  getAlarmPresentationDiagnostics?: (
    critical: boolean
  ) => Promise<AlarmPresentationDiagnostics>;
  openNativeAlarmChannelSettings?: (critical: boolean) => Promise<void>;
  finishActiveAlarm?: (alarmId?: string | null) => Promise<void>;
  consumePendingAlarmPayload?: () => Promise<DoseAlarmPayload | null>;
  clearAlarmWindowMode?: () => Promise<void>;
};

export const reminderPermissionsNative = NativeModules.ReminderPermissions as
  | ReminderPermissionsNativeModule
  | undefined;

export async function finishActiveAlarm(alarmId?: string | null): Promise<void> {
  await reminderPermissionsNative?.finishActiveAlarm?.(alarmId);
}

export async function consumePendingAlarmPayload(): Promise<DoseAlarmPayload | null> {
  return (await reminderPermissionsNative?.consumePendingAlarmPayload?.()) ?? null;
}

export async function clearAlarmWindowMode(): Promise<void> {
  await reminderPermissionsNative?.clearAlarmWindowMode?.();
}
