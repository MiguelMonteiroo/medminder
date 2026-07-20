type ReminderSyncCoordinatorOptions = {
  sync: () => Promise<void>;
  fallback: () => Promise<unknown>;
  onPendingChange: (pending: boolean) => void;
  pendingCounter?: { current: number; failed?: boolean };
};

export function startReminderSyncInBackground({
  sync,
  fallback,
  onPendingChange,
  pendingCounter = { current: 0, failed: false },
}: ReminderSyncCoordinatorOptions): void {
  if (pendingCounter.current === 0) pendingCounter.failed = false;
  pendingCounter.current += 1;
  onPendingChange(true);

  void sync()
    .catch(() => fallback())
    .then(
      () => {
        pendingCounter.current = Math.max(0, pendingCounter.current - 1);
        onPendingChange(
          pendingCounter.current > 0 || pendingCounter.failed === true
        );
      },
      () => {
        pendingCounter.failed = true;
        pendingCounter.current = Math.max(0, pendingCounter.current - 1);
        onPendingChange(true);
      }
    );
}
