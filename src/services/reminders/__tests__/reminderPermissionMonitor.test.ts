import { createReminderPermissionMonitor } from "../reminderPermissionMonitor";
import type { ReminderPermissionState } from "../../../types/domain";

const granted: ReminderPermissionState = {
  notifications: "granted",
  exactAlarms: "granted",
  fullScreen: "granted",
  doNotDisturb: "granted",
  criticalAlarmChannel: "bypasses",
  batteryOptimization: "unrestricted",
};

describe("reminderPermissionMonitor", () => {
  it("reconfigures scheduled reminders when an Android capability changes", async () => {
    const states: ReminderPermissionState[] = [
      { ...granted, exactAlarms: "denied", fullScreen: "denied" },
      granted,
    ];
    const onCapabilitiesChanged = jest.fn();
    const monitor = createReminderPermissionMonitor({
      readState: async () => states.shift()!,
      onCapabilitiesChanged,
    });

    await monitor.refresh();
    await monitor.refresh();

    expect(onCapabilitiesChanged).toHaveBeenCalledTimes(1);
    expect(onCapabilitiesChanged).toHaveBeenCalledWith(
      granted,
      expect.objectContaining({
        exactAlarms: "denied",
        fullScreen: "denied",
      })
    );
  });

  it("does not reconfigure reminders on the initial read or unchanged state", async () => {
    const onCapabilitiesChanged = jest.fn();
    const monitor = createReminderPermissionMonitor({
      readState: async () => granted,
      onCapabilitiesChanged,
    });

    await monitor.refresh();
    await monitor.refresh();

    expect(onCapabilitiesChanged).not.toHaveBeenCalled();
  });

  it("ignores battery optimization changes when notification capabilities are stable", async () => {
    const states: ReminderPermissionState[] = [
      { ...granted, batteryOptimization: "optimized" },
      granted,
    ];
    const onCapabilitiesChanged = jest.fn();
    const monitor = createReminderPermissionMonitor({
      readState: async () => states.shift()!,
      onCapabilitiesChanged,
    });

    await monitor.refresh();
    await monitor.refresh();

    expect(onCapabilitiesChanged).not.toHaveBeenCalled();
  });

  it("reconfigures reminders when DND access is revoked", async () => {
    const states: ReminderPermissionState[] = [
      granted,
      { ...granted, doNotDisturb: "denied" },
    ];
    const onCapabilitiesChanged = jest.fn();
    const monitor = createReminderPermissionMonitor({
      readState: async () => states.shift()!,
      onCapabilitiesChanged,
    });

    await monitor.refresh();
    await monitor.refresh();

    expect(onCapabilitiesChanged).toHaveBeenCalledTimes(1);
  });

  it("reconfigures reminders when the critical channel loses DND bypass", async () => {
    const states: ReminderPermissionState[] = [
      granted,
      { ...granted, criticalAlarmChannel: "blocked" },
    ];
    const onCapabilitiesChanged = jest.fn();
    const monitor = createReminderPermissionMonitor({
      readState: async () => states.shift()!,
      onCapabilitiesChanged,
    });

    await monitor.refresh();
    await monitor.refresh();

    expect(onCapabilitiesChanged).toHaveBeenCalledTimes(1);
  });
});
