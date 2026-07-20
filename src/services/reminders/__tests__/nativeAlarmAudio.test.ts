import { createAlarmAudioController } from "../nativeAlarmAudio";

describe("nativeAlarmAudio", () => {
  const payload = {
    alarmId: "alarm-1",
    artifactKind: "doseAlarm" as const,
    title: "Dipirona",
    body: "500 mg",
    doseOccurrenceId: "dose-1",
    medicationId: "med-1",
    scheduleId: "schedule-1",
    scheduledAt: "2026-07-19T08:00:00.000Z",
    doseWindowKey: "2026-07-19T08:00",
    showDetails: true,
    fullScreenEnabled: true,
    criticalAlertsEnabled: false,
  };

  it("delegates scheduling and cancellation to Android", async () => {
    const nativeModule = {
      scheduleAlarmAudio: jest.fn(async () => true),
      cancelAlarmAudio: jest.fn(async () => undefined),
      cancelAllAlarmAudio: jest.fn(async () => undefined),
    };
    const controller = createAlarmAudioController(nativeModule, true);

    await expect(
      controller.schedule("alarm-1", 1_000, 60_000, payload)
    ).resolves.toBe(true);
    await controller.cancel("alarm-1");
    await controller.cancelAll();

    expect(nativeModule.scheduleAlarmAudio).toHaveBeenCalledWith(
      "alarm-1",
      1_000,
      60_000,
      payload
    );
    expect(nativeModule.cancelAlarmAudio).toHaveBeenCalledWith("alarm-1");
    expect(nativeModule.cancelAllAlarmAudio).toHaveBeenCalledTimes(1);
  });

  it("falls back without native calls outside Android", async () => {
    const nativeModule = {
      scheduleAlarmAudio: jest.fn(async () => true),
      cancelAlarmAudio: jest.fn(async () => undefined),
      cancelAllAlarmAudio: jest.fn(async () => undefined),
    };
    const controller = createAlarmAudioController(nativeModule, false);

    await expect(
      controller.schedule("alarm-1", 1_000, 60_000, payload)
    ).resolves.toBe(false);
    await controller.cancel("alarm-1");

    expect(nativeModule.scheduleAlarmAudio).not.toHaveBeenCalled();
    expect(nativeModule.cancelAlarmAudio).not.toHaveBeenCalled();
  });
});
