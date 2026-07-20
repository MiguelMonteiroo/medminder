import { useEffect, useState } from "react";
import { ActivityIndicator, DeviceEventEmitter, StyleSheet } from "react-native";
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
import { DoseAlarmScreen } from "./src/screens/DoseAlarmScreen";
import {
  asDoseAlarmPayload,
  type DoseAlarmPayload,
} from "./src/services/reminders/alarmPayloadLoader";
import {
  handleNavigationReady,
  navigationRef,
  resetToHome,
} from "./src/navigation/navigationRef";

type AppProps = {
  initialAlarmPayload?: DoseAlarmPayload | null;
};

export default function App({ initialAlarmPayload }: AppProps) {
  const [launchAlarm, setLaunchAlarm] = useState(() =>
    asDoseAlarmPayload(initialAlarmPayload)
  );

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "RemedinNativeAlarmStopped",
      () => {
        setLaunchAlarm(null);
        resetToHome();
      }
    );
    return () => subscription.remove();
  }, []);

  if (launchAlarm) {
    return (
      <SafeAreaProvider>
        <DoseAlarmScreen
          onClose={() => {
            setLaunchAlarm(null);
            resetToHome();
          }}
          payload={launchAlarm}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <NavigationContainer
          onReady={handleNavigationReady}
          ref={navigationRef}
        >
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

