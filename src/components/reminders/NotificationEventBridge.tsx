import { useCallback, useEffect, useState } from "react";
import { AppState, DeviceEventEmitter, Modal } from "react-native";
import notifee, { EventType } from "@notifee/react-native";
import { DoseAlarmScreen } from "../../screens/DoseAlarmScreen";
import type { DoseAlarmPayload } from "../../services/reminders/alarmPayloadLoader";
import { handleNotifeeEvent } from "../../services/reminders/notificationEventHandler";
import { shouldPresentAlarmScreen } from "../../services/reminders/notificationPresentation";
import {
  consumePendingAlarmPayload,
  finishActiveAlarm,
} from "../../services/reminders/nativeReminderPermissions";
import { useAppData } from "../../services/appDataProvider";
import { resetToHome } from "../../navigation/navigationRef";

export function NotificationEventBridge() {
  const [alarm, setAlarm] = useState<DoseAlarmPayload | null>(null);
  const { refreshDoseLogs } = useAppData();

  const presentAlarm = useCallback((payload: DoseAlarmPayload) => {
    setAlarm((current) =>
      current?.notificationId === payload.notificationId ? current : payload
    );
  }, []);

  const consumePendingAlarm = useCallback(async () => {
    const payload = await consumePendingAlarmPayload().catch(() => null);
    if (payload) presentAlarm(payload);
  }, [presentAlarm]);

  const dismissAlarm = useCallback(() => {
    setAlarm(null);
    resetToHome();
  }, []);

  const cancelAndDismissAlarm = useCallback(() => {
    const alarmId = alarm?.notificationId;
    void finishActiveAlarm(alarmId).finally(dismissAlarm);
  }, [alarm?.notificationId, dismissAlarm]);

  useEffect(() => {
    const deliveredSubscription = DeviceEventEmitter.addListener(
      "RemedinNativeAlarmDelivered",
      presentAlarm
    );
    const stoppedSubscription = DeviceEventEmitter.addListener(
      "RemedinNativeAlarmStopped",
      dismissAlarm
    );
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void consumePendingAlarm();
    });

    void consumePendingAlarm();
    return () => {
      deliveredSubscription.remove();
      stoppedSubscription.remove();
      appStateSubscription.remove();
    };
  }, [consumePendingAlarm, dismissAlarm, presentAlarm]);

  useEffect(
    () =>
      notifee.onForegroundEvent(async (event) => {
        if (event.type === EventType.DELIVERED && event.detail.notification) {
          const notification = event.detail.notification;
          const kind = notification.data?.artifactKind;
          if (shouldPresentAlarmScreen(kind)) {
            presentAlarm({
              notificationId: notification.id || "",
              title: notification.title || "Hora do medicamento",
              body: notification.body || "",
              data: notification.data || {},
            });
          }
        }
        try {
          await handleNotifeeEvent(event);
        } finally {
          if (event.type === EventType.ACTION_PRESS) {
            await refreshDoseLogs().catch(() => undefined);
          }
        }
      }),
    [presentAlarm, refreshDoseLogs]
  );

  return (
    <Modal
      animationType="fade"
      onRequestClose={cancelAndDismissAlarm}
      transparent={false}
      visible={alarm !== null}
    >
      <DoseAlarmScreen
        embedded
        onDoseAction={refreshDoseLogs}
        onClose={cancelAndDismissAlarm}
        payload={alarm}
      />
    </Modal>
  );
}
