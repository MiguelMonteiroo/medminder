import {
  fullScreenAlarmAction,
  isFullScreenAlarmReady,
  type AlarmPresentationDiagnostics,
} from "../alarmPresentationDiagnostics";

const ready: AlarmPresentationDiagnostics = {
  fullScreenAccess: true,
  channelImportance: 4,
  notificationsEnabled: true,
  keyguardLocked: false,
  screenInteractive: true,
};

describe("alarm presentation diagnostics", () => {
  it("requires the preference, notification access, full-screen access and a high channel", () => {
    expect(isFullScreenAlarmReady(true, ready)).toBe(true);
    expect(isFullScreenAlarmReady(false, ready)).toBe(false);
    expect(
      isFullScreenAlarmReady(true, { ...ready, notificationsEnabled: false })
    ).toBe(false);
    expect(
      isFullScreenAlarmReady(true, { ...ready, fullScreenAccess: false })
    ).toBe(false);
    expect(
      isFullScreenAlarmReady(true, { ...ready, channelImportance: 3 })
    ).toBe(false);
  });

  it("selects the system setting that can resolve the first blocking condition", () => {
    expect(
      fullScreenAlarmAction({ ...ready, notificationsEnabled: false })
    ).toBe("notifications");
    expect(fullScreenAlarmAction({ ...ready, fullScreenAccess: false })).toBe(
      "fullScreen"
    );
    expect(fullScreenAlarmAction({ ...ready, channelImportance: 3 })).toBe(
      "channel"
    );
    expect(fullScreenAlarmAction(ready)).toBeNull();
  });
});
