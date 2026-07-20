import { startReminderSyncInBackground } from "../reminderSyncCoordinator";

async function flushPromises(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe("startReminderSyncInBackground", () => {
  it("does not block the caller when native reminder scheduling never settles", () => {
    const onPendingChange = jest.fn();
    const neverSettles = new Promise<void>(() => undefined);

    expect(
      startReminderSyncInBackground({
        sync: () => neverSettles,
        fallback: jest.fn(),
        onPendingChange,
      })
    ).toBeUndefined();
    expect(onPendingChange).toHaveBeenCalledWith(true);
  });

  it("clears the pending state after a successful sync", async () => {
    const onPendingChange = jest.fn();

    startReminderSyncInBackground({
      sync: async () => undefined,
      fallback: jest.fn(),
      onPendingChange,
    });
    await flushPromises();

    expect(onPendingChange).toHaveBeenNthCalledWith(1, true);
    expect(onPendingChange).toHaveBeenLastCalledWith(false);
  });

  it("uses reconciliation after a scheduling failure", async () => {
    const fallback = jest.fn(async () => undefined);
    const onPendingChange = jest.fn();

    startReminderSyncInBackground({
      sync: async () => {
        throw new Error("native scheduling failed");
      },
      fallback,
      onPendingChange,
    });
    await flushPromises();

    expect(fallback).toHaveBeenCalledTimes(1);
    expect(onPendingChange).toHaveBeenLastCalledWith(false);
  });

  it("keeps the pending state when scheduling and reconciliation fail", async () => {
    const onPendingChange = jest.fn();

    startReminderSyncInBackground({
      sync: async () => {
        throw new Error("native scheduling failed");
      },
      fallback: async () => {
        throw new Error("reconciliation failed");
      },
      onPendingChange,
    });
    await flushPromises();

    expect(onPendingChange).toHaveBeenNthCalledWith(1, true);
    expect(onPendingChange).toHaveBeenLastCalledWith(true);
  });

  it("stays pending until all concurrent sync operations finish", async () => {
    let finishFirst!: () => void;
    const firstSync = new Promise<void>((resolve) => {
      finishFirst = resolve;
    });
    const pendingCounter = { current: 0 };
    const onPendingChange = jest.fn();

    startReminderSyncInBackground({
      sync: () => firstSync,
      fallback: async () => undefined,
      onPendingChange,
      pendingCounter,
    });
    startReminderSyncInBackground({
      sync: async () => undefined,
      fallback: async () => undefined,
      onPendingChange,
      pendingCounter,
    });
    await flushPromises();

    expect(onPendingChange).toHaveBeenLastCalledWith(true);

    finishFirst();
    await flushPromises();

    expect(onPendingChange).toHaveBeenLastCalledWith(false);
  });
});
