import {
  AndroidImportance,
  AndroidLaunchActivityFlag,
} from "@notifee/react-native";
import {
  buildAlarmTestNotification,
  buildDoseAlarmNotification,
  buildPreAlertNotification,
} from "../notificationBuilder";

const dose = {
  occurrenceId: "occ-1",
  medicationId: "med-1",
  scheduleId: "sched-1",
  doseWindowKey: "2026-07-03T08:00",
  medicationName: "Dipirona",
  dosage: "5 mg",
  notes: "Tomar após comer",
  scheduledAt: "2026-07-03T08:00:00",
};

describe("notificationBuilder", () => {
  it("builds a private pre-alert without dose actions", () => {
    const notification = buildPreAlertNotification(dose, false);

    expect(notification.title).toBe("Medicamento em 5 minutos");
    expect(notification.android?.actions).toBeUndefined();
    expect(notification.android?.channelId).toBe("medication-pre-alerts-v1");
  });

  it("shows medication details when lock-screen details are enabled", () => {
    const notification = buildPreAlertNotification(dose, true);

    expect(notification.title).toBe("Dipirona em 5 minutos");
    expect(notification.body).toContain("5 mg");
  });

  it("adds full-screen and individual actions to a dose alarm", () => {
    const notification = buildDoseAlarmNotification(dose, {
      showDetails: true,
      fullScreenEnabled: true,
      useCriticalChannel: false,
      useNativeAudio: false,
    });

    expect(notification.android?.fullScreenAction).toEqual({
      id: "dose-alarm",
      launchActivity: "com.remedin.MainActivity",
      launchActivityFlags: [
        AndroidLaunchActivityFlag.NEW_TASK,
        AndroidLaunchActivityFlag.CLEAR_TOP,
        AndroidLaunchActivityFlag.SINGLE_TOP,
      ],
    });
    expect(notification.android?.pressAction).toEqual({
      id: "open-dose-window",
      launchActivity: "com.remedin.MainActivity",
      launchActivityFlags: [
        AndroidLaunchActivityFlag.NEW_TASK,
        AndroidLaunchActivityFlag.CLEAR_TOP,
        AndroidLaunchActivityFlag.SINGLE_TOP,
      ],
    });
    expect(notification.android?.channelId).toBe(
      "medication-dose-alarms-v3"
    );
    expect(notification.android?.actions?.map((action) => action.pressAction.id)).toEqual([
      "mark-taken",
      "snooze-five",
    ]);
    expect(notification.android?.loopSound).toBe(true);
    expect(notification.android?.importance).toBe(AndroidImportance.HIGH);
    expect(notification.android?.timeoutAfter).toBe(60_000);
  });

  it("requires opening the app to mark a private lock-screen dose", () => {
    const notification = buildDoseAlarmNotification(dose, {
      showDetails: false,
      fullScreenEnabled: false,
      useCriticalChannel: true,
      useNativeAudio: false,
    });

    expect(notification.title).toBe("Hora do medicamento");
    expect(notification.android?.fullScreenAction).toBeUndefined();
    expect(notification.android?.channelId).toBe(
      "medication-dose-alarms-critical-v3"
    );
    expect(notification.android?.actions?.map((action) => action.pressAction.id)).toEqual([
      "open-dose-window",
      "snooze-five",
    ]);
  });

  it("uses a silent alarm channel when native audio owns playback", () => {
    const notification = buildDoseAlarmNotification(dose, {
      showDetails: true,
      fullScreenEnabled: true,
      useCriticalChannel: true,
      useNativeAudio: true,
    });

    expect(notification.android?.channelId).toBe(
      "medication-dose-alarms-player-critical-v1"
    );
    expect(notification.android?.loopSound).toBe(false);
  });

  it("opens alarm tests in the main application Activity", () => {
    const notification = buildAlarmTestNotification({
      fullScreenEnabled: true,
      useCriticalChannel: true,
      useNativeAudio: false,
    });

    expect(notification.android?.pressAction?.launchActivity).toBe(
      "com.remedin.MainActivity"
    );
    expect(notification.android?.pressAction?.mainComponent).toBeUndefined();
    expect(notification.android?.fullScreenAction?.launchActivity).toBe(
      "com.remedin.MainActivity"
    );
    expect(notification.android?.fullScreenAction?.mainComponent).toBeUndefined();
    expect(notification.android?.fullScreenAction?.launchActivityFlags).toEqual([
      AndroidLaunchActivityFlag.NEW_TASK,
      AndroidLaunchActivityFlag.CLEAR_TOP,
      AndroidLaunchActivityFlag.SINGLE_TOP,
    ]);
  });
});
