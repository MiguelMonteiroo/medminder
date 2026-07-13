import { shouldPresentAlarmScreen } from "../notificationPresentation";

describe("notificationPresentation", () => {
  it.each(["doseAlarm", "snoozedAlarm", "alarmTest"])(
    "presents the alarm screen for %s",
    (kind) => {
      expect(shouldPresentAlarmScreen(kind)).toBe(true);
    }
  );

  it.each(["preAlert", "alarmHandoff", "reinforcement", undefined])(
    "does not present the alarm screen for %s",
    (kind) => {
      expect(shouldPresentAlarmScreen(kind)).toBe(false);
    }
  );
});
