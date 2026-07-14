import { NavigationContainer } from "@react-navigation/native";
import { DatabaseProvider } from "./src/database/DatabaseProvider";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AppDataProvider } from "./src/services/appDataProvider";
import { NotificationEventBridge } from "./src/components/reminders/NotificationEventBridge";
import { ReminderSetupGuide } from "./src/components/reminders/ReminderSetupGuide";

export default function App() {
  return (
    <DatabaseProvider>
      <NavigationContainer>
        <AppDataProvider>
          <AppNavigator />
          <NotificationEventBridge />
          <ReminderSetupGuide />
        </AppDataProvider>
      </NavigationContainer>
    </DatabaseProvider>
  );
}

