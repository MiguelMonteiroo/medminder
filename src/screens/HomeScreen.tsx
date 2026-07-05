import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronRight, Pill } from "lucide-react-native";
import { CareCompletedDoseRow } from "../components/CareCompletedDoseRow";
import { CareDoseActionCard } from "../components/CareDoseActionCard";
import { CareHeader } from "../components/CareHeader";
import { CareNextDoseCard } from "../components/CareNextDoseCard";
import { CareProgressRing } from "../components/CareProgressRing";
import { EmptyState } from "../components/ui/EmptyState";
import { Screen } from "../components/ui/Screen";
import { SectionHeader } from "../components/ui/SectionHeader";
import { AppText } from "../components/ui/AppText";
import { useAppData } from "../services/appDataProvider";
import { RootStackParamList, RootTabParamList } from "../navigation/types";
import { DoseOccurrence } from "../types/domain";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
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
  const nextOccurrence = pendingOccurrences[0];
  const nextMedication = nextOccurrence
    ? medications.find((m) => m.id === nextOccurrence.medicationId)
    : undefined;
  const progress =
    todaySummary.total === 0 ? 0 : todaySummary.taken / todaySummary.total;

  function getMedication(occurrence: DoseOccurrence) {
    return medications.find((m) => m.id === occurrence.medicationId);
  }

  function renderPending(occurrence: DoseOccurrence) {
    const medication = getMedication(occurrence);
    if (!medication) return null;

    return (
      <CareDoseActionCard
        key={occurrence.id}
        time={getOccurrenceTime(occurrence)}
        name={medication.name}
        dosage={medication.dosage}
        onTake={() =>
          setDoseTaken(
            occurrence.id,
            occurrence.medicationId,
            occurrence.scheduleId,
            false
          )
        }
        onSnooze={() =>
          snoozeDose(occurrence.id, occurrence.medicationId, occurrence.scheduleId)
        }
        onSkip={() =>
          skipDose(occurrence.id, occurrence.medicationId, occurrence.scheduleId)
        }
        onPress={() =>
          navigation.navigate("MedicationDetail", {
            medicationId: occurrence.medicationId,
          })
        }
      />
    );
  }

  function renderCompleted(occurrence: DoseOccurrence) {
    const medication = getMedication(occurrence);
    if (!medication) return null;

    return (
      <CareCompletedDoseRow
        key={occurrence.id}
        time={getOccurrenceTime(occurrence)}
        name={medication.name}
        dosage={medication.dosage}
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <CareHeader
          title="Bom dia, Maria!"
          subtitle="Estamos aqui para ajudar você."
          initials="M"
        />

        <View style={styles.progressPanel}>
          <CareProgressRing progress={progress} />
          <View style={styles.progressCopy}>
            <AppText variant="heading" style={styles.progressTitle}>
              Hoje
            </AppText>
            <AppText>
              {todaySummary.taken} de {todaySummary.total} doses concluídas
            </AppText>
            <View style={styles.encouragement}>
              <Pill color={colors.primary} size={18} />
              <View>
                <AppText style={styles.encouragementTitle}>Continue assim!</AppText>
                <AppText variant="small" muted>
                  Sua rotina faz a diferença.
                </AppText>
              </View>
            </View>
          </View>
        </View>

        <CareNextDoseCard
          time={nextOccurrence ? getOccurrenceTime(nextOccurrence) : "--:--"}
          name={nextMedication?.name}
          dosage={nextMedication?.dosage}
          onPress={
            nextOccurrence
              ? () =>
                  navigation.navigate("MedicationDetail", {
                    medicationId: nextOccurrence.medicationId,
                  })
              : undefined
          }
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
              meta={`${pendingOccurrences.length}`}
            />
            {pendingOccurrences.length > 0 ? (
              pendingOccurrences.map(renderPending)
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
                  meta={`${completedOccurrences.length}`}
                />
                <View style={styles.completedPanel}>
                  {completedOccurrences.slice(0, 3).map(renderCompleted)}
                  {completedOccurrences.length > 3 ? (
                    <Pressable style={styles.moreCompleted}>
                      <AppText style={styles.moreCompletedText}>
                        Ver todas as concluídas
                      </AppText>
                      <ChevronRight color={colors.primaryDark} size={20} />
                    </Pressable>
                  ) : null}
                </View>
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
  content: {
    paddingBottom: spacing.xxl,
  },
  progressPanel: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
  },
  progressCopy: {
    flex: 1,
    marginLeft: spacing.xl,
  },
  progressTitle: {
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  encouragement: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  encouragementTitle: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  completedPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
  },
  moreCompleted: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
  },
  moreCompletedText: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
});
