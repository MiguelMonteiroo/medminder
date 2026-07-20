export type DoseAlarmPayload = {
  notificationId: string;
  title: string;
  body: string;
  data: Record<string, string | number | object>;
};

type InitialAlarmNotification = {
  notification?: {
    id?: string;
    title?: string;
    body?: string;
    data?: Record<string, string | number | object>;
  };
};

type DisplayedAlarmNotification = {
  id?: string;
  date?: string;
  notification: InitialAlarmNotification["notification"];
};

type LoadInitialAlarmPayloadOptions = {
  launchPayload?: DoseAlarmPayload | null;
  readInitialNotification: () => Promise<InitialAlarmNotification | null>;
  readDisplayedNotifications?: () => Promise<DisplayedAlarmNotification[]>;
  attempts?: number;
  retryDelayMs?: number;
  wait?: (delayMs: number) => Promise<void>;
};

const DEFAULT_ATTEMPTS = 8;
const DEFAULT_RETRY_DELAY_MS = 250;
const ALARM_ARTIFACT_KINDS = new Set([
  "doseAlarm",
  "snoozedAlarm",
  "alarmTest",
]);

export function asDoseAlarmPayload(
  payload: DoseAlarmPayload | null | undefined
): DoseAlarmPayload | null {
  const kind = payload?.data?.artifactKind;
  return ALARM_ARTIFACT_KINDS.has(String(kind || "")) ? payload ?? null : null;
}

function delay(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export function toDoseAlarmPayload(
  initial: InitialAlarmNotification | null
): DoseAlarmPayload | null {
  const notification = initial?.notification;
  if (!notification) return null;

  return asDoseAlarmPayload({
    notificationId: notification.id || "",
    title: notification.title || "Hora do medicamento",
    body: notification.body || "Dose agendada agora.",
    data: notification.data || {},
  });
}

function latestDisplayedAlarm(
  displayed: DisplayedAlarmNotification[]
): DoseAlarmPayload | null {
  const candidate = displayed
    .filter((item) =>
      ALARM_ARTIFACT_KINDS.has(String(item.notification?.data?.artifactKind || ""))
    )
    .sort((left, right) =>
      String(right.date || "").localeCompare(String(left.date || ""))
    )[0];
  if (!candidate?.notification) return null;

  return {
    notificationId: candidate.notification.id || candidate.id || "",
    title: candidate.notification.title || "Hora do medicamento",
    body: candidate.notification.body || "Dose agendada agora.",
    data: candidate.notification.data || {},
  };
}

export async function loadInitialAlarmPayload({
  launchPayload,
  readInitialNotification,
  readDisplayedNotifications,
  attempts = DEFAULT_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  wait = delay,
}: LoadInitialAlarmPayloadOptions): Promise<DoseAlarmPayload | null> {
  const validatedLaunchPayload = asDoseAlarmPayload(launchPayload);
  if (validatedLaunchPayload) return validatedLaunchPayload;

  const boundedAttempts = Math.max(1, attempts);
  for (let attempt = 0; attempt < boundedAttempts; attempt += 1) {
    const payload = toDoseAlarmPayload(await readInitialNotification());
    if (payload) return payload;
    if (readDisplayedNotifications) {
      const displayedPayload = latestDisplayedAlarm(
        await readDisplayedNotifications()
      );
      if (displayedPayload) return displayedPayload;
    }
    if (attempt < boundedAttempts - 1) await wait(retryDelayMs);
  }

  return null;
}
