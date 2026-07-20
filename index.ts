import { AppRegistry } from "react-native";
import notifee from "@notifee/react-native";
import App from "./App";
import {
  executeDefaultNotificationCommand,
  handleNotifeeEvent,
  reconcileRemindersFromBackground,
} from "./src/services/reminders/notificationEventHandler";
import { finishActiveAlarm } from "./src/services/reminders/nativeReminderPermissions";

notifee.onBackgroundEvent(handleNotifeeEvent);

AppRegistry.registerComponent("Remedin", () => App);
AppRegistry.registerHeadlessTask(
  "RemedinReminderReconcile",
  () => reconcileRemindersFromBackground
);
AppRegistry.registerHeadlessTask("RemedinAlarmAction", () => async (command) => {
  await executeDefaultNotificationCommand(command);
  await finishActiveAlarm(command.notificationId);
});
