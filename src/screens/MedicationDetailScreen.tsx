import { Alert, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { AppText } from "../components/ui/AppText";
import { Screen } from "../components/ui/Screen";
import { StatusBadge } from "../components/ui/StatusBadge";
import { RootStackParamList } from "../navigation/types";
import { useAppData } from "../services/appDataProvider";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = NativeStackScreenProps<RootStackParamList, "MedicationDetail">;

export function MedicationDetailScreen({ route, navigation }: Props) {
  const { medicationId } = route.params;
  const { medications, schedules, removeMedication, setMedicationPaused } =
    useAppData();

  const medication = medications.find((m) => m.id === medicationId);
  const medSchedules = schedules.filter((s) => s.medicationId === medicationId);

  if (!medication) {
    return (
      <Screen style={styles.center}>
        <AppText variant="subheading" style={styles.errorText}>
          Medicamento não encontrado.
        </AppText>
      </Screen>
    );
  }

  const firstSchedule = medSchedules[0];
  const paused = medication.isPaused;
  const medicationName = medication.name;

  async function handleTogglePause() {
    await setMedicationPaused(medicationId, !paused);
  }

  function handleDelete() {
    Alert.alert(
      "Remover medicamento",
      `Tem certeza que deseja remover ${medicationName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            await removeMedication(medicationId);
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <Screen>
      <AppText variant="caption" muted>
        Medicamento
      </AppText>
      <View style={styles.titleRow}>
        <AppText variant="title" style={styles.title}>
          {medication.name}
        </AppText>
        <StatusBadge status={paused ? "paused" : "active"} />
      </View>

      <AppCard style={styles.card}>
        <AppText variant="subheading">Detalhes</AppText>
        <InfoRow label="Dosagem" value={medication.dosage} />
        {medication.notes ? <InfoRow label="Notas" value={medication.notes} /> : null}
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="subheading">Agendamento</AppText>
        {firstSchedule ? (
          <>
            <InfoRow label="Horário" value={firstSchedule.times.join(", ")} />
            <InfoRow
              label="Tipo"
              value={
                firstSchedule.kind === "dailyTimes"
                  ? "Diário"
                  : firstSchedule.kind === "intervalHours"
                  ? `A cada ${firstSchedule.intervalHours}h`
                  : "Dias da semana"
              }
            />
          </>
        ) : (
          <AppText muted style={styles.emptyText}>
            Nenhum agendamento ativo.
          </AppText>
        )}
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          title={paused ? "Reativar medicamento" : "Pausar medicamento"}
          variant={paused ? "success" : "warning"}
          onPress={handleTogglePause}
          accessibilityLabel={paused ? "Reativar medicamento" : "Pausar medicamento"}
        />
        <AppButton
          title="Editar"
          variant="ghost"
          onPress={() =>
            Alert.alert("Editar medicamento", "A edição entrará na próxima etapa.")
          }
          accessibilityLabel="Editar medicamento"
        />
        <AppButton
          title="Remover"
          variant="danger"
          onPress={handleDelete}
          accessibilityLabel="Remover medicamento"
        />
      </View>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText muted>{label}</AppText>
      <AppText style={styles.infoValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: colors.danger,
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  title: {
    flex: 1,
  },
  card: {
    marginBottom: spacing.md,
  },
  infoRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
  },
  infoValue: {
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  emptyText: {
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
