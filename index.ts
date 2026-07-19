import { AppRegistry } from "react-native";
import notifee from "@notifee/react-native";
import App from "./App";
import { DoseAlarmRoot } from "./src/screens/DoseAlarmScreen";
import {
  handleNotifeeEvent,
  reconcileRemindersFromBackground,
} from "./src/services/reminders/notificationEventHandler";

notifee.onBackgroundEvent(handleNotifeeEvent);

AppRegistry.registerComponent("Remedin", () => App);
AppRegistry.registerComponent("RemedinDoseAlarm", () => DoseAlarmRoot);
AppRegistry.registerHeadlessTask(
  "RemedinReminderReconcile",
  () => reconcileRemindersFromBackground
);
