import { ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DatabaseProvider } from "./src/database/DatabaseProvider";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AppDataProvider } from "./src/services/appDataProvider";
import { NotificationEventBridge } from "./src/components/reminders/NotificationEventBridge";
import { FirstRunOnboarding } from "./src/components/onboarding/FirstRunOnboarding";
import { Screen } from "./src/components/ui/Screen";
import { AppText } from "./src/components/ui/AppText";
import { useAppData } from "./src/services/appDataProvider";
import { colors } from "./src/theme/colors";
import { spacing } from "./src/theme/spacing";

export default function App() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <NavigationContainer>
          <AppDataProvider>
            <AppExperience />
          </AppDataProvider>
        </NavigationContainer>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}

function AppExperience() {
  const { error, loading, settings } = useAppData();

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <AppText muted style={styles.loadingText}>
          Preparando seu cuidado...
        </AppText>
      </Screen>
    );
  }

  if (!error && !settings.onboardingCompleted) {
    return <FirstRunOnboarding />;
  }

  return (
    <>
      <AppNavigator />
      <NotificationEventBridge />
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: spacing.md },
});

