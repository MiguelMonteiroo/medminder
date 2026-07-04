import { NavigationContainer } from "@react-navigation/native";
import { SQLiteProvider } from "expo-sqlite";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AppDataProvider } from "./src/services/appDataProvider";
import { migrateDbIfNeeded } from "./src/database/migrations";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

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
    <SQLiteProvider
      databaseName="medminder.db"
      onInit={migrateDbIfNeeded}
      useSuspense
    >
      <NavigationContainer>
        <AppDataProvider>
          <AppNavigator />
        </AppDataProvider>
      </NavigationContainer>
    </SQLiteProvider>
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


