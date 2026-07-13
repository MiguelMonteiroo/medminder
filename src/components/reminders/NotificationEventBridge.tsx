import { useEffect, useState } from "react";
import { Modal } from "react-native";
import notifee, { EventType } from "@notifee/react-native";
import {
  DoseAlarmScreen,
  type DoseAlarmPayload,
} from "../../screens/DoseAlarmScreen";
import { handleNotifeeEvent } from "../../services/reminders/notificationEventHandler";
import { shouldPresentAlarmScreen } from "../../services/reminders/notificationPresentation";

export function NotificationEventBridge() {
  const [alarm, setAlarm] = useState<DoseAlarmPayload | null>(null);

  useEffect(() =>
    notifee.onForegroundEvent(async (event) => {
      if (event.type === EventType.DELIVERED && event.detail.notification) {
        const notification = event.detail.notification;
        const kind = notification.data?.artifactKind;
        if (shouldPresentAlarmScreen(kind)) {
          setAlarm({
            notificationId: notification.id || "",
            title: notification.title || "Hora do medicamento",
            body: notification.body || "",
            data: notification.data || {},
          });
        }
      }
      await handleNotifeeEvent(event);
    }), []);

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => setAlarm(null)}
      transparent={false}
      visible={alarm !== null}
    >
      <DoseAlarmScreen
        embedded
        onClose={() => setAlarm(null)}
        payload={alarm}
      />
    </Modal>
  );
}
