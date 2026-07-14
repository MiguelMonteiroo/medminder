import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pill, Plus } from "lucide-react-native";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { AppText } from "../components/ui/AppText";
import { EmptyState } from "../components/ui/EmptyState";
import { Screen } from "../components/ui/Screen";
import { StatusBadge } from "../components/ui/StatusBadge";
import { RootStackParamList, RootTabParamList } from "../navigation/types";
import { useAppData } from "../services/appDataProvider";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "Medications">,
  NativeStackScreenProps<RootStackParamList>
>;

export function MedicationsScreen({ navigation }: Props) {
  const { medications, schedules } = useAppData();

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="title" style={styles.title}>
              Medicamentos
            </AppText>
            <AppText muted>Todos os cuidados cadastrados em um só lugar.</AppText>
          </View>
          <AppButton
            title="+"
            compact
            onPress={() => navigation.navigate("AddMedication")}
            accessibilityLabel="Adicionar medicamento"
            style={styles.addButton}
          />
        </View>

        {medications.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="Nenhum medicamento cadastrado"
            message="Adicione seu primeiro medicamento para montar sua rotina."
          />
        ) : (
          medications.map((medication) => {
            const schedule = schedules.find(
              (candidate) =>
                candidate.medicationId === medication.id && candidate.isActive
            );
            return (
              <Pressable
                key={medication.id}
                onPress={() =>
                  navigation.navigate("MedicationDetail", {
                    medicationId: medication.id,
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${medication.name}`}
              >
                <AppCard style={styles.card}>
                  <View style={styles.medRow}>
                    <View style={styles.icon}>
                      <Pill color={colors.primary} size={24} />
                    </View>
                    <View style={styles.info}>
                      <AppText variant="subheading">{medication.name}</AppText>
                      <AppText variant="small" muted>
                        {medication.dosage}
                      </AppText>
                      <AppText variant="caption" muted style={styles.schedule}>
                        {schedule?.times[0] || "--:--"} ·{" "}
                        {schedule?.kind === "intervalHours"
                          ? `A cada ${schedule.intervalHours}h`
                          : schedule?.kind === "weekdays"
                          ? "Dias selecionados"
                          : "Todos os dias"}
                      </AppText>
                    </View>
                    <StatusBadge status={medication.isPaused ? "paused" : "active"} />
                  </View>
                </AppCard>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  addButton: {
    minWidth: 48,
  },
  card: {
    marginBottom: spacing.md,
  },
  medRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 48,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  schedule: {
    marginTop: spacing.xs,
  },
});
