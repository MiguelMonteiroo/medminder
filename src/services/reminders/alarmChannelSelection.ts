import type { ReminderPermissionState } from "../../types/domain";

export function shouldUseCriticalAlarmChannel(
  criticalAlertsEnabled: boolean,
  doNotDisturbAccess: ReminderPermissionState["doNotDisturb"],
  criticalAlarmChannel: ReminderPermissionState["criticalAlarmChannel"]
): boolean {
  return (
    criticalAlertsEnabled &&
    doNotDisturbAccess === "granted" &&
    criticalAlarmChannel === "bypasses"
  );
}

export function toDoNotDisturbPermissionState(
  granted: boolean
): ReminderPermissionState["doNotDisturb"] {
  return granted ? "granted" : "denied";
}
