import {
  shouldUseCriticalAlarmChannel,
  toDoNotDisturbPermissionState,
} from "../alarmChannelSelection";

describe("shouldUseCriticalAlarmChannel", () => {
  it("uses the critical channel only when preference and Android access are active", () => {
    expect(shouldUseCriticalAlarmChannel(true, "granted")).toBe(true);
    expect(shouldUseCriticalAlarmChannel(true, "denied")).toBe(false);
    expect(shouldUseCriticalAlarmChannel(false, "granted")).toBe(false);
  });

  it("falls back to the normal channel after DND access is revoked", () => {
    expect(shouldUseCriticalAlarmChannel(true, "denied")).toBe(false);
  });

  it("maps Android DND access for granted, denied and revoked states", () => {
    expect(toDoNotDisturbPermissionState(true)).toBe("granted");
    expect(toDoNotDisturbPermissionState(false)).toBe("denied");
    expect(toDoNotDisturbPermissionState(false)).toBe("denied");
  });
});
