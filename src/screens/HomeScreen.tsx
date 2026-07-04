import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pill, Plus } from "lucide-react-native";
import { MedicationCard } from "../components/MedicationCard";
import { MedicationSummary } from "../components/MedicationSummary";
import { EmptyState } from "../components/ui/EmptyState";
import { IconButton } from "../components/ui/IconButton";
import { Screen } from "../components/ui/Screen";
import { SectionHeader } from "../components/ui/SectionHeader";
import { AppText } from "../components/ui/AppText";
import { useAppData } from "../services/appDataProvider";
import { RootStackParamList, RootTabParamList } from "../navigation/types";
import { DoseOccurrence } from "../types/domain";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

function getOccurrenceTime(occurrence: DoseOccurrence) {
  return occurrence.scheduledAt.split("T")[1]?.substring(0, 5) || "--:--";
}

export function HomeScreen({ navigation }: Props) {
  const {
    medications,
    schedules,
    todayOccurrences,
    todaySummary,
    loading,
    error,
    setDoseTaken,
    skipDose,
    snoozeDose,
  } = useAppData();

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText muted style={styles.loadingText}>
          Carregando sua rotina...
        </AppText>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen style={styles.center}>
        <AppText variant="subheading" style={styles.errorText}>
          Não foi possível carregar seus dados.
        </AppText>
        <AppText muted style={styles.centerText}>
          {error}
        </AppText>
      </Screen>
    );
  }

  const pendingOccurrences = todayOccurrences.filter(
    (occurrence) => occurrence.status === "pending" || occurrence.status === "snoozed"
  );
  const completedOccurrences = todayOccurrences.filter(
    (occurrence) => occurrence.status === "taken" || occurrence.status === "skipped"
  );
  const nextDoseTime = pendingOccurrences[0]
    ? getOccurrenceTime(pendingOccurrences[0])
    : undefined;

  function renderOccurrence(occurrence: DoseOccurrence) {
    const medication = medications.find((m) => m.id === occurrence.medicationId);
    const schedule = schedules.find((s) => s.id === occurrence.scheduleId);
    if (!medication) return null;

    return (
      <MedicationCard
        key={occurrence.id}
        name={medication.name}
        dosage={medication.dosage}
        time={getOccurrenceTime(occurrence)}
        frequency={
          schedule?.kind === "intervalHours"
            ? `A cada ${schedule.intervalHours}h`
            : schedule?.kind === "weekdays"
            ? "Dias selecionados"
            : "Diária"
        }
        notes={occurrence.status === "snoozed" ? "Dose adiada" : medication.notes}
        status={occurrence.status}
        onTake={() =>
          setDoseTaken(
            occurrence.id,
            occurrence.medicationId,
            occurrence.scheduleId,
            occurrence.status === "taken"
          )
        }
        onSkip={() =>
          skipDose(occurrence.id, occurrence.medicationId, occurrence.scheduleId)
        }
        onSnooze={() =>
          snoozeDose(occurrence.id, occurrence.medicationId, occurrence.scheduleId)
        }
        onPress={() =>
          navigation.navigate("MedicationDetail", {
            medicationId: occurrence.medicationId,
          })
        }
      />
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="caption" muted>
            Bom te ver por aqui
          </AppText>
          <AppText variant="title">Hoje</AppText>
        </View>
        <IconButton
          icon={Plus}
          label="Adicionar medicamento"
          onPress={() => navigation.navigate("AddMedication")}
          accessibilityHint="Abre o cadastro de medicamento"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <MedicationSummary
          takenCount={todaySummary.taken}
          totalCount={todaySummary.total}
          nextDoseTime={nextDoseTime}
        />

        {todayOccurrences.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="Sua rotina ainda está vazia"
            message="Cadastre seu primeiro medicamento para acompanhar as doses de hoje."
          />
        ) : (
          <>
            <SectionHeader
              title="Pendentes"
              meta={`${pendingOccurrences.length} dose${pendingOccurrences.length === 1 ? "" : "s"}`}
            />
            {pendingOccurrences.length > 0 ? (
              pendingOccurrences.map(renderOccurrence)
            ) : (
              <EmptyState
                icon={Pill}
                title="Nada pendente agora"
                message="Quando uma nova dose estiver prevista, ela aparecerá aqui."
              />
            )}

            {completedOccurrences.length > 0 ? (
              <>
                <SectionHeader
                  title="Concluídas"
                  meta={`${completedOccurrences.length} dose${completedOccurrences.length === 1 ? "" : "s"}`}
                />
                {completedOccurrences.map(renderOccurrence)}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.danger,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
});
