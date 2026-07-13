const ALARM_SCREEN_KINDS = new Set([
  "doseAlarm",
  "snoozedAlarm",
  "alarmTest",
]);

export function shouldPresentAlarmScreen(kind: unknown): boolean {
  return typeof kind === "string" && ALARM_SCREEN_KINDS.has(kind);
}
