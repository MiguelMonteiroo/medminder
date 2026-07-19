import {
  shouldUseCriticalAlarmChannel,
  toDoNotDisturbPermissionState,
} from "../alarmChannelSelection";

describe("shouldUseCriticalAlarmChannel", () => {
  it("uses the critical channel only when preference and Android access are active", () => {
    expect(shouldUseCriticalAlarmChannel(true, "granted", "bypasses")).toBe(true);
    expect(shouldUseCriticalAlarmChannel(true, "denied", "bypasses")).toBe(false);
    expect(shouldUseCriticalAlarmChannel(false, "granted", "bypasses")).toBe(false);
    expect(shouldUseCriticalAlarmChannel(true, "granted", "blocked")).toBe(false);
  });

  it("falls back to the normal channel after DND access is revoked", () => {
    expect(shouldUseCriticalAlarmChannel(true, "denied", "unavailable")).toBe(false);
  });

  it("maps current Android DND access without retaining stale grants", () => {
    expect(toDoNotDisturbPermissionState(true)).toBe("granted");
    expect(toDoNotDisturbPermissionState(false)).toBe("denied");
  });
});
