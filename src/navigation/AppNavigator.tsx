import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { HomeScreen } from "../screens/HomeScreen";
import { AddMedicationScreen } from "../screens/AddMedicationScreen";
import { MedicationDetailScreen } from "../screens/MedicationDetailScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "MedMinder" }}
      />
      <Stack.Screen
        name="AddMedication"
        component={AddMedicationScreen}
        options={{ title: "Adicionar Medicamento" }}
      />
      <Stack.Screen
        name="MedicationDetail"
        component={MedicationDetailScreen}
        options={{ title: "Detalhes" }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: "Histórico" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Configurações" }}
      />
    </Stack.Navigator>
  );
}
