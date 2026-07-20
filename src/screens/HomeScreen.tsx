import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, ScrollView, StyleSheet, View } from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CalendarDays, CheckCircle2, RefreshCw } from "lucide-react-native";
import { CareCompletedDoseRow } from "../components/CareCompletedDoseRow";
import { CareDoseActionCard } from "../components/CareDoseActionCard";
import { CareHeader } from "../components/CareHeader";
import { CareNextDoseCard } from "../components/CareNextDoseCard";
import { DailyProgressSummary } from "../components/DailyProgressSummary";
import { MedicationEmptyState } from "../components/MedicationEmptyState";
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
import { getHomePresentation } from "../utils/homePresentation";
import { ptBR } from "../i18n/ptBR";

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

function getOccurrenceTime(occurrence: DoseOccurrence) {
  return occurrence.scheduledAt.split("T")[1]?.substring(0, 5) || "--:--";
}

export function HomeScreen({ navigation }: Props) {
  const [greeting, setGreeting] = useState(() => getGreetingForHour(new Date().getHours()));
  const [undoingOccurrenceId, setUndoingOccurrenceId] = useState<string | null>(null);
  const undoingOccurrenceRef = useRef<string | null>(null);
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
    undoDoseAction,
    snoozeDose,
    snoozeMinutes,
  } = useAppData();

  useEffect(() => {
    let boundaryTimer: ReturnType<typeof setTimeout> | undefined;

    function refreshGreeting() {
      if (boundaryTimer) clearTimeout(boundaryTimer);
      const now = new Date();
      setGreeting(getGreetingForHour(now.getHours()));
      boundaryTimer = setTimeout(
        refreshGreeting,
        Math.max(1_000, getNextGreetingChange(now).getTime() - now.getTime())
      );
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
        <AppText muted style={styles.loadingText}>{ptBR.home.loading}</AppText>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen style={styles.center}>
        <AppText variant="subheading" style={styles.errorText}>{ptBR.home.loadErrorTitle}</AppText>
        <AppText muted style={styles.centerText}>{ptBR.home.loadErrorMessage}</AppText>
        <AppButton icon={RefreshCw} onPress={retryLoadingData} title={ptBR.actions.tryAgain} />
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
    ? medications.find((item) => item.id === nextOccurrence.medicationId)
    : undefined;
  const presentation = getHomePresentation({
    medicationCount: medications.length,
    total: todaySummary.total,
    taken: todaySummary.taken,
    pending: pendingOccurrences.length,
  });

  function getMedication(occurrence: DoseOccurrence) {
    return medications.find((item) => item.id === occurrence.medicationId);
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
        onTake={() => setDoseTaken(occurrence.id, occurrence.medicationId, occurrence.scheduleId, false)}
        onSnooze={() => snoozeDose(occurrence.id, occurrence.medicationId, occurrence.scheduleId)}
        onSkip={() => skipDose(occurrence.id, occurrence.medicationId, occurrence.scheduleId)}
        onPress={() => navigation.navigate("MedicationDetail", { medicationId: occurrence.medicationId })}
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
        onPress={() => navigation.navigate("MedicationDetail", { medicationId: occurrence.medicationId })}
        onUndo={
          occurrence.status === "skipped"
            ? async () => {
                if (undoingOccurrenceRef.current) return;
                undoingOccurrenceRef.current = occurrence.id;
                setUndoingOccurrenceId(occurrence.id);
                try {
                  await undoDoseAction(
                    occurrence.id,
                    occurrence.medicationId,
                    occurrence.scheduleId
                  );
                } finally {
                  undoingOccurrenceRef.current = null;
                  setUndoingOccurrenceId(null);
                }
              }
            : undefined
        }
        undoing={undoingOccurrenceId === occurrence.id}
      />
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <CareHeader
          title={`${greeting}${settings.userName.trim() ? `, ${settings.userName.trim()}` : ""}`}
          subtitle={
            presentation.kind === "active" || presentation.kind === "complete"
              ? presentation.headline
              : ptBR.home.subtitle
          }
          initials={settings.userName.trim().charAt(0).toUpperCase() || "M"}
        />

        {presentation.kind === "empty" ? (
          <MedicationEmptyState
            title={ptBR.home.emptyTitle}
            message={ptBR.home.emptyMessage}
            actionLabel={ptBR.actions.addMedication}
            onAction={() => navigation.navigate("AddMedication")}
          />
        ) : presentation.kind === "noDosesToday" ? (
          <MedicationEmptyState
            title={ptBR.home.noDosesTitle}
            message={ptBR.home.noDosesMessage}
            actionLabel={ptBR.actions.viewMedications}
            onAction={() => navigation.navigate("Medications")}
          />
        ) : (
          <>
            <DailyProgressSummary
              taken={todaySummary.taken}
              total={todaySummary.total}
              label={presentation.progressLabel}
              supportLabel={presentation.supportLabel}
            />

            {nextOccurrence ? (
              <View style={styles.nextSection}>
                <CareNextDoseCard
                  time={getOccurrenceTime(nextOccurrence)}
                  name={nextMedication?.name}
                  dosage={nextMedication?.dosage}
                  onPress={() => navigation.navigate("MedicationDetail", { medicationId: nextOccurrence.medicationId })}
                />
              </View>
            ) : (
              <View style={styles.completeBanner}>
                <CheckCircle2 color={colors.success} size={24} strokeWidth={2} />
                <AppText variant="small" weight="semibold" style={styles.completeText}>
                  {ptBR.home.allRegistered}
                </AppText>
              </View>
            )}

            {pendingOccurrences.length > 0 ? (
              <>
                <SectionHeader title={ptBR.home.pending} meta={`${pendingOccurrences.length}`} />
                {pendingOccurrences.map(renderPending)}
              </>
            ) : null}

            {registeredOccurrences.length > 0 ? (
              <>
                <SectionHeader title={ptBR.home.registered} meta={`${registeredOccurrences.length}`} />
                <View style={styles.registeredPanel}>{registeredOccurrences.map(renderRegistered)}</View>
                <AppButton
                  icon={CalendarDays}
                  onPress={() => navigation.navigate("History")}
                  size="compact"
                  title={ptBR.actions.viewHistory}
                  variant="ghost"
                />
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  centerText: { marginBottom: spacing.xl, marginTop: spacing.sm, textAlign: "center" },
  loadingText: { marginTop: spacing.md },
  errorText: { color: colors.danger, textAlign: "center" },
  content: { paddingBottom: spacing.xxl },
  nextSection: { marginTop: spacing.lg },
  completeBanner: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderColor: colors.successBorder,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
  },
  completeText: { color: colors.primaryDark, flex: 1 },
  registeredPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
  },
});
