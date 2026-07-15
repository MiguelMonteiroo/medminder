import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { BarChart3, CalendarCheck2 } from "lucide-react-native";
import { AppCard } from "../components/ui/AppCard";
import { AppText } from "../components/ui/AppText";
import { EmptyState } from "../components/ui/EmptyState";
import { Screen } from "../components/ui/Screen";
import { SectionHeader } from "../components/ui/SectionHeader";
import {
  StatusBadge,
  type BadgeStatus,
} from "../components/ui/StatusBadge";
import { useAppData } from "../services/appDataProvider";
import {
  buildDailyAdherenceSummary,
  type DailyAdherenceSummary,
  formatHistoryActionDateTime,
  formatHistoryDayLabel,
  getLast7Days,
} from "../utils/stats";
import type { DoseLog } from "../types/domain";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

export function HistoryScreen() {
  const { medications, schedules, doseLogs: logs, loading } = useAppData();
  const now = new Date();
  const dailySummaries = getLast7Days(now).map((date) =>
    buildDailyAdherenceSummary(date, medications, schedules, logs, now)
  );
  const todaySummary = dailySummaries[0];
  const recentLogs = [...logs]
    .sort((left, right) => right.actionAt.localeCompare(left.actionAt))
    .slice(0, 10);

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText muted style={styles.loadingText}>
          Preparando seu histórico...
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AppText variant="caption" muted>
          Acompanhamento
        </AppText>
        <AppText variant="title" style={styles.title}>
          Histórico
        </AppText>

        <TodayHistoryCard summary={todaySummary} />

        <SectionHeader title="Últimos 7 dias" meta="Mais recentes primeiro" />
        <View style={styles.timeline}>
          {dailySummaries.map((summary) => (
            <DailyHistoryRow key={summary.date} summary={summary} now={now} />
          ))}
        </View>

        <SectionHeader title="Últimas ações" />
        {recentLogs.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Sem histórico ainda"
            message="As doses tomadas, puladas ou adiadas aparecerão aqui."
          />
        ) : (
          <View style={styles.actionList}>
            {recentLogs.map((log) => {
              const medication = medications.find(
                (candidate) => candidate.id === log.medicationId
              );
              return (
                <View key={log.id} style={styles.actionRow}>
                  <View style={styles.actionInfo}>
                    <AppText style={styles.actionMedication}>
                      {medication?.name || "Medicamento removido"}
                    </AppText>
                    <AppText variant="caption" muted>
                      {formatHistoryActionDateTime(log.actionAt, now)}
                    </AppText>
                  </View>
                  <StatusBadge status={actionToStatus(log.action)} />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function TodayHistoryCard({ summary }: { summary: DailyAdherenceSummary }) {
  const hasDoses = summary.total > 0;

  return (
    <AppCard style={styles.heroCard}>
      <View style={styles.heroHeader}>
        <View style={styles.heroIcon}>
          <CalendarCheck2 color={colors.primaryDark} size={24} />
        </View>
        <View style={styles.heroHeading}>
          <AppText variant="caption" muted>
            Adesão de hoje
          </AppText>
          <AppText variant="heading" style={styles.heroTitle}>
            {hasDoses ? `${summary.percentage}%` : "Dia livre"}
          </AppText>
        </View>
      </View>

      {hasDoses ? (
        <>
          <ProgressBar percentage={summary.percentage || 0} />
          <AppText muted style={styles.heroDescription}>
            {getDaySummaryText(summary)}
          </AppText>
        </>
      ) : (
        <AppText muted style={styles.heroDescription}>
          Sem doses programadas para hoje.
        </AppText>
      )}
    </AppCard>
  );
}

function DailyHistoryRow({
  summary,
  now,
}: {
  summary: DailyAdherenceSummary;
  now: Date;
}) {
  const hasDoses = summary.total > 0;

  return (
    <View
      accessible
      accessibilityLabel={
        hasDoses
          ? `${formatHistoryDayLabel(summary.date, now)}. ${getDaySummaryText(summary)}. Adesão ${summary.percentage} por cento.`
          : `${formatHistoryDayLabel(summary.date, now)}. Sem doses programadas.`
      }
      style={styles.dayRow}
    >
      <View style={styles.dayHeader}>
        <View style={styles.dayText}>
          <AppText variant="subheading">
            {formatHistoryDayLabel(summary.date, now)}
          </AppText>
          <AppText variant="small" muted style={styles.dayDescription}>
            {hasDoses ? getDaySummaryText(summary) : "Sem doses programadas"}
          </AppText>
        </View>
        {hasDoses ? (
          <AppText variant="subheading" style={styles.dayPercentage}>
            {summary.percentage}%
          </AppText>
        ) : (
          <AppText variant="caption" style={styles.freeDayLabel}>
            Dia livre
          </AppText>
        )}
      </View>
      {hasDoses ? <ProgressBar percentage={summary.percentage || 0} compact /> : null}
    </View>
  );
}

function ProgressBar({
  percentage,
  compact = false,
}: {
  percentage: number;
  compact?: boolean;
}) {
  const width = `${Math.min(100, Math.max(0, percentage))}%` as `${number}%`;

  return (
    <View
      accessibilityLabel={`Progresso ${percentage} por cento`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      style={[styles.progressTrack, compact && styles.progressTrackCompact]}
    >
      <View style={[styles.progressFill, { width }]} />
    </View>
  );
}

function getDaySummaryText(summary: DailyAdherenceSummary): string {
  const parts = [`${summary.taken} de ${summary.total} tomadas`];
  if (summary.pending > 0) {
    parts.push(`${summary.pending} ${summary.pending === 1 ? "pendente" : "pendentes"}`);
  }
  if (summary.snoozed > 0) {
    parts.push(`${summary.snoozed} ${summary.snoozed === 1 ? "adiada" : "adiadas"}`);
  }
  if (summary.skipped > 0) {
    parts.push(`${summary.skipped} ${summary.skipped === 1 ? "pulada" : "puladas"}`);
  }
  if (summary.unrecorded > 0) {
    parts.push(
      `${summary.unrecorded} ${summary.unrecorded === 1 ? "não registrada" : "não registradas"}`
    );
  }
  return parts.join(" · ");
}

function actionToStatus(action: DoseLog["action"]): BadgeStatus {
  if (action === "taken") return "taken";
  if (action === "skipped") return "skipped";
  if (action === "snoozed") return "snoozed";
  return "undone";
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: spacing.md },
  content: { paddingBottom: spacing.xxl },
  title: {
    color: colors.primaryDark,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  heroCard: { marginBottom: spacing.md },
  heroHeader: { alignItems: "center", flexDirection: "row" },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 48,
  },
  heroHeading: { flex: 1 },
  heroTitle: { color: colors.success, marginTop: spacing.xs },
  heroDescription: { marginTop: spacing.md },
  progressTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    height: 10,
    marginTop: spacing.lg,
    overflow: "hidden",
  },
  progressTrackCompact: { height: 6, marginTop: spacing.md },
  progressFill: {
    backgroundColor: colors.success,
    borderRadius: radii.pill,
    height: "100%",
  },
  timeline: { gap: spacing.sm },
  dayRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  dayHeader: { alignItems: "center", flexDirection: "row" },
  dayText: { flex: 1, marginRight: spacing.md },
  dayDescription: { marginTop: spacing.xs },
  dayPercentage: { color: colors.primaryDark },
  freeDayLabel: { color: colors.success, fontWeight: "800" },
  actionList: { gap: spacing.sm },
  actionRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 64,
    padding: spacing.lg,
  },
  actionInfo: { flex: 1, marginRight: spacing.md },
  actionMedication: { fontWeight: "700", marginBottom: spacing.xs },
});
