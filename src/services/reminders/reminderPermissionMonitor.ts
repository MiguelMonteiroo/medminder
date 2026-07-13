import type { ReminderPermissionState } from "../../types/domain";

type ReminderPermissionMonitorDependencies = {
  readState: () => Promise<ReminderPermissionState>;
  onCapabilitiesChanged: (
    current: ReminderPermissionState,
    previous: ReminderPermissionState
  ) => Promise<void> | void;
};

function capabilityKey(state: ReminderPermissionState): string {
  return [state.notifications, state.exactAlarms, state.fullScreen].join(":");
}

export function createReminderPermissionMonitor({
  readState,
  onCapabilitiesChanged,
}: ReminderPermissionMonitorDependencies) {
  let previous: ReminderPermissionState | null = null;
  let pending: Promise<ReminderPermissionState> | null = null;

  async function runRefresh(): Promise<ReminderPermissionState> {
    const current = await readState();
    const previousState = previous;

    if (
      previousState &&
      capabilityKey(previousState) !== capabilityKey(current)
    ) {
      await onCapabilitiesChanged(current, previousState);
    }

    previous = current;
    return current;
  }

  function refresh(): Promise<ReminderPermissionState> {
    if (pending) return pending;

    pending = runRefresh().finally(() => {
      pending = null;
    });
    return pending;
  }

  return { refresh };
}

export type ReminderPermissionMonitor = ReturnType<
  typeof createReminderPermissionMonitor
>;
