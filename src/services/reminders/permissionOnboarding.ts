import type { ReminderPermissionState } from "../../types/domain";

export const ONBOARDING_PERMISSION_STEPS = [
  "notifications",
  "lockScreenDetails",
  "doNotDisturb",
  "exact",
  "fullScreen",
  "battery",
] as const;

export type OnboardingPermissionStep =
  (typeof ONBOARDING_PERMISSION_STEPS)[number];

export type NotificationOnboardingAction =
  | "request"
  | "settings"
  | "continue";

export function getNotificationOnboardingAction(
  state: ReminderPermissionState["notifications"],
  requestAttempted: boolean
): NotificationOnboardingAction {
  if (state === "granted") return "continue";
  if (state === "denied" && requestAttempted) return "settings";
  return "request";
}
