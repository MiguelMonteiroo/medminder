import { shouldReconcileDeliveredNotification } from "../notificationDeliveryPolicy";

describe("notification delivery reconciliation", () => {
  it("does not reconcile while a pre-alert is being presented", () => {
    expect(
      shouldReconcileDeliveredNotification({ artifactKind: "preAlert" })
    ).toBe(false);
  });

  it("keeps reconciliation enabled for other delivered reminders", () => {
    expect(
      shouldReconcileDeliveredNotification({ artifactKind: "reinforcement" })
    ).toBe(true);
  });
});
