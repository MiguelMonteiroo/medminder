import { createAlarmAudioController } from "../nativeAlarmAudio";

describe("nativeAlarmAudio", () => {
  it("delegates scheduling and cancellation to Android", async () => {
    const nativeModule = {
      scheduleAlarmAudio: jest.fn(async () => true),
      cancelAlarmAudio: jest.fn(async () => undefined),
      cancelAllAlarmAudio: jest.fn(async () => undefined),
    };
    const controller = createAlarmAudioController(nativeModule, true);

    await expect(controller.schedule("alarm-1", 1_000, 60_000)).resolves.toBe(
      true
    );
    await controller.cancel("alarm-1");
    await controller.cancelAll();

    expect(nativeModule.scheduleAlarmAudio).toHaveBeenCalledWith(
      "alarm-1",
      1_000,
      60_000
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

    await expect(controller.schedule("alarm-1", 1_000, 60_000)).resolves.toBe(
      false
    );
    await controller.cancel("alarm-1");

    expect(nativeModule.scheduleAlarmAudio).not.toHaveBeenCalled();
    expect(nativeModule.cancelAlarmAudio).not.toHaveBeenCalled();
  });
});
