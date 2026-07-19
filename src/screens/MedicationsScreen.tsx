import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronRight, Pill, Plus } from "lucide-react-native";
import { AppButton } from "../components/ui/AppButton";
import { AppText } from "../components/ui/AppText";
import { Screen } from "../components/ui/Screen";
import { StatusBadge } from "../components/ui/StatusBadge";
import { MedicationEmptyState } from "../components/MedicationEmptyState";
import { RootStackParamList, RootTabParamList } from "../navigation/types";
import { useAppData } from "../services/appDataProvider";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";
import { ptBR } from "../i18n/ptBR";

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "Medications">,
  NativeStackScreenProps<RootStackParamList>
>;

export function MedicationsScreen({ navigation }: Props) {
  const { medications, schedules } = useAppData();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppText variant="title" style={styles.title}>{ptBR.medications.title}</AppText>
        <AppText muted style={styles.subtitle}>{ptBR.medications.subtitle}</AppText>

        {medications.length === 0 ? (
          <MedicationEmptyState
            title={ptBR.medications.emptyTitle}
            message={ptBR.medications.emptyMessage}
            actionLabel={ptBR.actions.addMedication}
            onAction={() => navigation.navigate("AddMedication")}
          />
        ) : (
          <>
            <AppButton
              icon={Plus}
              onPress={() => navigation.navigate("AddMedication")}
              size="compact"
              style={styles.addButton}
              title={ptBR.actions.addMedication}
            />
            <View style={styles.list}>
              {medications.map((medication, index) => {
                const schedule = schedules.find(
                  (candidate) => candidate.medicationId === medication.id && candidate.isActive
                );
                const title = medication.dosage && medication.dosage !== "Sem dosagem"
                  ? `${medication.name} (${medication.dosage})`
                  : medication.name;
                return (
                  <Pressable
                    key={medication.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir ${title}`}
                    onPress={() => navigation.navigate("MedicationDetail", { medicationId: medication.id })}
                    style={({ pressed }) => [
                      styles.row,
                      index < medications.length - 1 && styles.rowDivider,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.icon}>
                      <Pill color={colors.primaryDark} size={26} strokeWidth={2} />
                    </View>
                    <View style={styles.info}>
                      <AppText variant="subheading" weight="semibold">{title}</AppText>
                      <View style={styles.statusRow}>
                        <StatusBadge status={medication.isPaused ? "paused" : "active"} />
                        <AppText variant="caption" muted style={styles.schedule}>{getScheduleLabel(schedule)}</AppText>
                      </View>
                    </View>
                    <ChevronRight color={colors.textMuted} size={22} strokeWidth={2} />
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function getScheduleLabel(schedule: ReturnType<typeof useAppData>["schedules"][number] | undefined) {
  if (!schedule) return "Sem horário ativo";
  if (schedule.kind === "intervalHours") return `A cada ${schedule.intervalHours} horas`;
  if (schedule.kind === "weekdays") return `${schedule.times[0] ?? "--:--"} · Dias selecionados`;
  return `${schedule.times[0] ?? "--:--"} · Todos os dias`;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  title: { color: colors.primaryDark },
  subtitle: { marginBottom: spacing.lg, marginTop: spacing.xs },
  addButton: { alignSelf: "flex-start", marginBottom: spacing.lg },
  list: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, overflow: "hidden", paddingHorizontal: spacing.lg },
  row: { alignItems: "center", flexDirection: "row", minHeight: 92, paddingVertical: spacing.md },
  rowDivider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  pressed: { opacity: 0.72 },
  icon: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: radii.md, height: 52, justifyContent: "center", marginRight: spacing.md, width: 52 },
  info: { flex: 1, marginRight: spacing.sm },
  statusRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  schedule: { flexShrink: 1 },
});
