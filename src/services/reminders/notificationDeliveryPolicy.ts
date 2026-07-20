export function shouldReconcileDeliveredNotification(
  data?: { artifactKind?: unknown }
): boolean {
  return data?.artifactKind !== "preAlert";
}
