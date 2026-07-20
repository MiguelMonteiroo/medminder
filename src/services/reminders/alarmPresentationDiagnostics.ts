export type AlarmPresentationDiagnostics = {
  fullScreenAccess: boolean;
  channelImportance: number;
  notificationsEnabled: boolean;
  keyguardLocked: boolean;
  screenInteractive: boolean;
};

export type FullScreenAlarmAction =
  | "notifications"
  | "fullScreen"
  | "channel";

const ANDROID_IMPORTANCE_HIGH = 4;

export function isFullScreenAlarmReady(
  preferenceEnabled: boolean,
  diagnostics: AlarmPresentationDiagnostics | null
): boolean {
  return Boolean(
    preferenceEnabled &&
      diagnostics?.notificationsEnabled &&
      diagnostics.fullScreenAccess &&
      diagnostics.channelImportance >= ANDROID_IMPORTANCE_HIGH
  );
}

export function fullScreenAlarmAction(
  diagnostics: AlarmPresentationDiagnostics
): FullScreenAlarmAction | null {
  if (!diagnostics.notificationsEnabled) return "notifications";
  if (!diagnostics.fullScreenAccess) return "fullScreen";
  if (diagnostics.channelImportance < ANDROID_IMPORTANCE_HIGH) return "channel";
  return null;
}
