import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CheckCircle2, ChevronRight, Pill, RefreshCw } from "lucide-react-native";
import { CareCompletedDoseRow } from "../components/CareCompletedDoseRow";
import { CareDoseActionCard } from "../components/CareDoseActionCard";
import { CareHeader } from "../components/CareHeader";
import { CareNextDoseCard } from "../components/CareNextDoseCard";
import { CareProgressRing } from "../components/CareProgressRing";
import { EmptyState } from "../components/ui/EmptyState";
import { Screen } from "../components/ui/Screen";
import { SectionHeader } from "../components/ui/SectionHeader";
import { AppText } from "../components/ui/AppText";
import { AppButton } from "../components/ui/AppButton";
import { useAppData } from "../services/appDataProvider";
import { RootStackParamList, RootTabParamList } from "../navigation/types";
import { DoseOccurrence } from "../types/domain";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";
import { getGreetingForHour, getNextGreetingChange } from "../utils/greeting";

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

function getOccurrenceTime(occurrence: DoseOccurrence) {
  return occurrence.scheduledAt.split("T")[1]?.substring(0, 5) || "--:--";
}

function getEncouragement(summary: {
  total: number;
  taken: number;
  pending: number;
  skipped: number;
  snoozed: number;
}) {
  if (summary.total === 0) {
    return {
      title: "Comece sua rotina",
      message: "Cadastre um medicamento para acompanhar seu cuidado.",
    };
  }

  if (summary.pending > 0 || summary.snoozed > 0) {
    const waiting = summary.pending + summary.snoozed;
    return {
      title: "Ainda tem cuidado pendente",
      message: `${waiting} dose${waiting === 1 ? "" : "s"} aguardando sua atenção.`,
    };
  }

  if (summary.skipped > 0 && summary.taken === 0) {
    return {
      title: "Doses registradas",
      message: "Você pulou as doses de hoje. A adesão fica em 0%.",
    };
  }

  if (summary.skipped > 0) {
    return {
      title: "Dia registrado",
      message: `${summary.taken} tomada${summary.taken === 1 ? "" : "s"} e ${summary.skipped} pulada${summary.skipped === 1 ? "" : "s"}.`,
    };
  }

  return {
    title: "Continue assim!",
    message: "Sua rotina faz a diferença.",
  };
}

export function HomeScreen({ navigation }: Props) {
  const [greeting, setGreeting] = useState(() =>
    getGreetingForHour(new Date().getHours())
  );
  const {
    medications,
    todayOccurrences,
    todaySummary,
    settings,
    loading,
    error,
    retryLoadingData,
    setDoseTaken,
    skipDose,
    snoozeDose,
    snoozeMinutes,
  } = useAppData();

  useEffect(() => {
    let boundaryTimer: ReturnType<typeof setTimeout> | undefined;

    function refreshGreeting() {
      if (boundaryTimer) clearTimeout(boundaryTimer);
      const now = new Date();
      setGreeting(getGreetingForHour(now.getHours()));
      const delay = Math.max(
        1_000,
        getNextGreetingChange(now).getTime() - now.getTime()
      );
      boundaryTimer = setTimeout(refreshGreeting, delay);
    }

    refreshGreeting();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshGreeting();
    });

    return () => {
      if (boundaryTimer) clearTimeout(boundaryTimer);
      subscription.remove();
    };
  }, []);

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
          Nada foi apagado. Tente carregar sua rotina novamente.
        </AppText>
        <AppButton
          accessibilityHint="Tenta ler novamente os dados armazenados no aparelho"
          accessibilityLabel="Tentar carregar os dados novamente"
          icon={RefreshCw}
          onPress={retryLoadingData}
          title="Tentar novamente"
        />
      </Screen>
    );
  }

  const pendingOccurrences = todayOccurrences.filter(
    (occurrence) => occurrence.status === "pending" || occurrence.status === "snoozed"
  );
  const registeredOccurrences = todayOccurrences.filter(
    (occurrence) => occurrence.status === "taken" || occurrence.status === "skipped"
  );
  const nextOccurrence = pendingOccurrences[0];
  const nextMedication = nextOccurrence
    ? medications.find((m) => m.id === nextOccurrence.medicationId)
    : undefined;
  const registeredCount = todaySummary.taken + todaySummary.skipped;
  const adherenceProgress =
    todaySummary.total === 0 ? 0 : todaySummary.taken / todaySummary.total;
  const encouragement = getEncouragement(todaySummary);

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
        snoozeMinutes={snoozeMinutes}
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

  function renderRegistered(occurrence: DoseOccurrence) {
    const medication = getMedication(occurrence);
    if (!medication) return null;

    return (
      <CareCompletedDoseRow
        key={occurrence.id}
        time={getOccurrenceTime(occurrence)}
        name={medication.name}
        dosage={medication.dosage}
        status={occurrence.status as "taken" | "skipped"}
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
          title={`${greeting}, ${settings.userName}!`}
          subtitle="Estamos aqui para ajudar você."
          initials={settings.userName.trim().charAt(0).toUpperCase() || "M"}
        />

        <View style={styles.progressPanel}>
          <CareProgressRing progress={adherenceProgress} />
          <View style={styles.progressCopy}>
            <AppText variant="heading" style={styles.progressTitle}>
              Hoje
            </AppText>
            <AppText>
              {todaySummary.taken} de {todaySummary.total} doses tomadas
            </AppText>
            {todaySummary.skipped > 0 ? (
              <AppText variant="small" muted style={styles.secondarySummary}>
                {registeredCount} de {todaySummary.total} doses registradas,
                incluindo {todaySummary.skipped} pulada
                {todaySummary.skipped === 1 ? "" : "s"}.
              </AppText>
            ) : null}
            <View style={styles.encouragement}>
              <Pill color={colors.primary} size={18} />
              <View style={styles.encouragementCopy}>
                <AppText style={styles.encouragementTitle}>
                  {encouragement.title}
                </AppText>
                <AppText variant="small" muted>
                  {encouragement.message}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {nextOccurrence ? (
          <CareNextDoseCard
            time={getOccurrenceTime(nextOccurrence)}
            name={nextMedication?.name}
            dosage={nextMedication?.dosage}
            onPress={() =>
              navigation.navigate("MedicationDetail", {
                medicationId: nextOccurrence.medicationId,
              })
            }
          />
        ) : null}

        {todayOccurrences.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="Sua rotina ainda está vazia"
            message="Cadastre seu primeiro medicamento para acompanhar as doses de hoje."
          />
        ) : (
          <>
            <SectionHeader title="Pendentes" meta={`${pendingOccurrences.length}`} />
            {pendingOccurrences.length > 0 ? (
              pendingOccurrences.map(renderPending)
            ) : (
              <View style={styles.noPendingCard}>
                <View style={styles.noPendingIcon}>
                  <CheckCircle2 color={colors.success} size={24} />
                </View>
                <View style={styles.noPendingCopy}>
                  <AppText variant="subheading" style={styles.noPendingTitle}>
                    Nada pendente agora
                  </AppText>
                  <AppText variant="small" style={styles.noPendingText}>
                    As doses previstas já foram registradas.
                  </AppText>
                </View>
              </View>
            )}

            {registeredOccurrences.length > 0 ? (
              <>
                <SectionHeader
                  title="Registradas"
                  meta={`${registeredOccurrences.length}`}
                />
                <View style={styles.registeredPanel}>
                  {registeredOccurrences.slice(0, 3).map(renderRegistered)}
                  {registeredOccurrences.length > 3 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Ver todas as doses registradas no histórico"
                      onPress={() => navigation.navigate("History")}
                      style={styles.moreRegistered}
                    >
                      <AppText style={styles.moreRegisteredText}>
                        Ver todas as registradas
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
  secondarySummary: {
    marginTop: spacing.xs,
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
  encouragementCopy: {
    flex: 1,
  },
  encouragementTitle: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  noPendingCard: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderColor: "#B8DFC5",
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  noPendingIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 44,
  },
  noPendingCopy: {
    flex: 1,
  },
  noPendingTitle: {
    color: colors.success,
  },
  noPendingText: {
    color: colors.primaryDark,
  },
  registeredPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
  },
  moreRegistered: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
  },
  moreRegisteredText: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
});
