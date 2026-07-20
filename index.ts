import { AppRegistry } from "react-native";
import notifee from "@notifee/react-native";
import App from "./App";
import { DoseAlarmRoot } from "./src/screens/DoseAlarmScreen";
import {
  executeDefaultNotificationCommand,
  handleNotifeeEvent,
  reconcileRemindersFromBackground,
} from "./src/services/reminders/notificationEventHandler";
import { finishDoseAlarmActivityIfOpen } from "./src/services/reminders/nativeReminderPermissions";

notifee.onBackgroundEvent(handleNotifeeEvent);

AppRegistry.registerComponent("Remedin", () => App);
AppRegistry.registerComponent("RemedinDoseAlarm", () => DoseAlarmRoot);
AppRegistry.registerHeadlessTask(
  "RemedinReminderReconcile",
  () => reconcileRemindersFromBackground
);
AppRegistry.registerHeadlessTask("RemedinAlarmAction", () => async (command) => {
  await executeDefaultNotificationCommand(command);
  await finishDoseAlarmActivityIfOpen();
});
