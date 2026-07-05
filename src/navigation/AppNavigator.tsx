import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CalendarCheck, History, PillBottle, UserRound } from "lucide-react-native";
import { HomeScreen } from "../screens/HomeScreen";
import { AddMedicationScreen } from "../screens/AddMedicationScreen";
import { MedicationDetailScreen } from "../screens/MedicationDetailScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { MedicationsScreen } from "../screens/MedicationsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { RootStackParamList, RootTabParamList } from "./types";
import { colors } from "../theme/colors";
import { ptBR } from "../i18n/ptBR";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<RootTabParamList>();

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 68,
          paddingBottom: 9,
          paddingTop: 9,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: ptBR.tabs.today,
          tabBarIcon: ({ color, size }) => (
            <CalendarCheck color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="Medications"
        component={MedicationsScreen}
        options={{
          title: ptBR.tabs.medications,
          tabBarIcon: ({ color, size }) => <PillBottle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: ptBR.tabs.history,
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={SettingsScreen}
        options={{
          title: ptBR.tabs.profile,
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "800" },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddMedication"
        component={AddMedicationScreen}
        options={{ title: "Adicionar medicamento" }}
      />
      <Stack.Screen
        name="MedicationDetail"
        component={MedicationDetailScreen}
        options={{ title: "Detalhes" }}
      />
    </Stack.Navigator>
  );
}
