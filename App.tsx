import { NavigationContainer } from "@react-navigation/native";
import { DatabaseProvider } from "./src/database/DatabaseProvider";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AppDataProvider } from "./src/services/appDataProvider";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NotificationEventBridge } from "./src/components/reminders/NotificationEventBridge";
import { ReminderSetupGuide } from "./src/components/reminders/ReminderSetupGuide";

function LoadingFallback() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
}

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

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
});


