import type { ReminderPermissionState } from "../../types/domain";

export function shouldUseCriticalAlarmChannel(
  criticalAlertsEnabled: boolean,
  doNotDisturbAccess: ReminderPermissionState["doNotDisturb"]
): boolean {
  return criticalAlertsEnabled && doNotDisturbAccess === "granted";
}

export function toDoNotDisturbPermissionState(
  granted: boolean
): ReminderPermissionState["doNotDisturb"] {
  return granted ? "granted" : "denied";
}
