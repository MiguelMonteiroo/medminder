import { REMINDER_SETTING_ORDER } from "../reminderSettingsOrder";

describe("REMINDER_SETTING_ORDER", () => {
  it("presents permissions from the basic capability to advanced reliability", () => {
    expect(REMINDER_SETTING_ORDER).toEqual([
      "notifications",
      "silentMode",
      "exactAlarm",
      "fullScreen",
      "lockScreenDetails",
      "background",
    ]);
  });
});
