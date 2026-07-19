import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";
import { CalendarCheck, History, PillBottle, UserRound, type LucideIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeScreen } from "../screens/HomeScreen";
import { AddMedicationScreen } from "../screens/AddMedicationScreen";
import { EditMedicationScreen } from "../screens/EditMedicationScreen";
import { MedicationDetailScreen } from "../screens/MedicationDetailScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { MedicationsScreen } from "../screens/MedicationsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { RootStackParamList, RootTabParamList } from "./types";
import { colors } from "../theme/colors";
import { ptBR } from "../i18n/ptBR";
import { fontFamilies } from "../theme/typography";
import { AppText } from "../components/ui/AppText";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<RootTabParamList>();

const TAB_CONFIG: Record<keyof RootTabParamList, { flex: number; icon: LucideIcon; label: string }> = {
  Home: { flex: 0.8, icon: CalendarCheck, label: ptBR.tabs.today },
  Medications: { flex: 1.4, icon: PillBottle, label: ptBR.tabs.medications },
  History: { flex: 1, icon: History, label: ptBR.tabs.history },
  Profile: { flex: 0.8, icon: UserRound, label: ptBR.tabs.profile },
};

function MainTabs() {
  return (
    <Tabs.Navigator
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: ptBR.tabs.today,
        }}
      />
      <Tabs.Screen
        name="Medications"
        component={MedicationsScreen}
        options={{
          title: ptBR.tabs.medications,
        }}
      />
      <Tabs.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: ptBR.tabs.history,
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={SettingsScreen}
        options={{
          title: ptBR.tabs.profile,
        }}
      />
    </Tabs.Navigator>
  );
}

function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name as keyof RootTabParamList];
        const focused = state.index === index;
        const color = focused ? colors.primary : colors.textMuted;
        const Icon = config.icon;

        return (
          <Pressable
            accessibilityLabel={config.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            key={route.key}
            onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            style={({ pressed }) => [styles.tabItem, { flex: config.flex }, pressed && styles.tabPressed]}
          >
            <Icon color={color} size={25} strokeWidth={2} />
            <AppText allowFontScaling={false} numberOfLines={1} style={[styles.tabLabel, { color }]} variant="caption" weight="medium">
              {config.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fontFamilies.bold },
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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditMedication"
        component={EditMedicationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MedicationDetail"
        component={MedicationDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    minHeight: 76,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: "center",
    gap: 3,
    justifyContent: "center",
    minHeight: 58,
  },
  tabLabel: {
    textAlign: "center",
    width: "100%",
  },
  tabPressed: {
    opacity: 0.7,
  },
});
