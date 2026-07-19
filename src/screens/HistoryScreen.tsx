import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { BarChart3, CalendarCheck2 } from "lucide-react-native";
import { AppCard } from "../components/ui/AppCard";
import { AppText } from "../components/ui/AppText";
import { EmptyState } from "../components/ui/EmptyState";
import { Screen } from "../components/ui/Screen";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusBadge, type BadgeStatus } from "../components/ui/StatusBadge";
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
import { ptBR } from "../i18n/ptBR";

export function HistoryScreen() {
  const { medications, schedules, doseLogs: logs, loading } = useAppData();
  const now = new Date();
  const dailySummaries = getLast7Days(now).map((date) =>
    buildDailyAdherenceSummary(date, medications, schedules, logs, now)
  );
  const recentLogs = [...logs].sort((left, right) => right.actionAt.localeCompare(left.actionAt)).slice(0, 10);

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText muted style={styles.loadingText}>{ptBR.history.loading}</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppText variant="title" style={styles.title}>{ptBR.history.title}</AppText>
        <AppText muted style={styles.subtitle}>{ptBR.history.subtitle}</AppText>

        <TodayHistoryCard summary={dailySummaries[0]} />

        <SectionHeader title={ptBR.history.lastSevenDays} meta={ptBR.history.newestFirst} />
        <View style={styles.group}>
          {dailySummaries.map((summary, index) => (
            <DailyHistoryRow key={summary.date} summary={summary} now={now} last={index === dailySummaries.length - 1} />
          ))}
        </View>

        <SectionHeader title={ptBR.history.recentActions} />
        {recentLogs.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title={ptBR.history.emptyTitle}
            message={ptBR.history.emptyMessage}
          />
        ) : (
          <View style={styles.group}>
            {recentLogs.map((log, index) => {
              const medication = medications.find((candidate) => candidate.id === log.medicationId);
              return (
                <View key={log.id} style={[styles.actionRow, index < recentLogs.length - 1 && styles.divider]}>
                  <View style={styles.actionInfo}>
                    <AppText variant="small" weight="semibold" style={styles.actionMedication}>
                      {medication?.name || "Medicamento removido"}
                    </AppText>
                    <AppText variant="caption" muted>{formatHistoryActionDateTime(log.actionAt, now)}</AppText>
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
        <View style={styles.heroIcon}><CalendarCheck2 color={colors.primaryDark} size={26} strokeWidth={2} /></View>
        <View style={styles.heroHeading}>
          <AppText variant="caption" muted>{ptBR.history.todayRecords}</AppText>
          <AppText variant="heading" style={styles.heroTitle}>
            {hasDoses ? `${summary.taken} de ${summary.total} tomadas` : "Nenhuma dose prevista"}
          </AppText>
        </View>
      </View>
      {hasDoses ? (
        <>
          <ProgressBar percentage={summary.percentage || 0} />
          <AppText variant="small" muted style={styles.heroDescription}>{getDaySummaryText(summary)}</AppText>
        </>
      ) : (
        <AppText variant="small" muted style={styles.heroDescription}>{ptBR.history.noDosesToday}</AppText>
      )}
    </AppCard>
  );
}

function DailyHistoryRow({ summary, now, last }: { summary: DailyAdherenceSummary; now: Date; last: boolean }) {
  const hasDoses = summary.total > 0;
  return (
    <View
      accessible
      accessibilityLabel={hasDoses
        ? `${formatHistoryDayLabel(summary.date, now)}. ${getDaySummaryText(summary)}. ${summary.percentage} por cento de adesão.`
        : `${formatHistoryDayLabel(summary.date, now)}. Sem doses programadas.`}
      style={[styles.dayRow, !last && styles.divider]}
    >
      <View style={styles.dayHeader}>
        <View style={styles.dayText}>
          <AppText variant="small" weight="semibold">{formatHistoryDayLabel(summary.date, now)}</AppText>
          <AppText variant="caption" muted style={styles.dayDescription}>
            {hasDoses ? getDaySummaryText(summary) : "Sem doses programadas"}
          </AppText>
        </View>
        <AppText variant="small" weight="bold" style={hasDoses ? styles.dayPercentage : styles.freeDayLabel}>
          {hasDoses ? `${summary.percentage}%` : "Dia livre"}
        </AppText>
      </View>
      {hasDoses ? <ProgressBar percentage={summary.percentage || 0} compact /> : null}
    </View>
  );
}

function ProgressBar({ percentage, compact = false }: { percentage: number; compact?: boolean }) {
  const width = `${Math.min(100, Math.max(0, percentage))}%` as `${number}%`;
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percentage }} style={[styles.progressTrack, compact && styles.progressTrackCompact]}>
      <View style={[styles.progressFill, { width }]} />
    </View>
  );
}

function getDaySummaryText(summary: DailyAdherenceSummary) {
  const parts = [`${summary.taken} de ${summary.total} tomadas`];
  if (summary.pending > 0) parts.push(`${summary.pending} ${summary.pending === 1 ? "pendente" : "pendentes"}`);
  if (summary.snoozed > 0) parts.push(`${summary.snoozed} ${summary.snoozed === 1 ? "adiada" : "adiadas"}`);
  if (summary.skipped > 0) parts.push(`${summary.skipped} ${summary.skipped === 1 ? "pulada" : "puladas"}`);
  if (summary.unrecorded > 0) parts.push(`${summary.unrecorded} ${summary.unrecorded === 1 ? "não registrada" : "não registradas"}`);
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
  title: { color: colors.primaryDark },
  subtitle: { marginBottom: spacing.lg, marginTop: spacing.xs },
  heroCard: { marginBottom: spacing.md, padding: spacing.lg },
  heroHeader: { alignItems: "center", flexDirection: "row" },
  heroIcon: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: radii.md, height: 52, justifyContent: "center", marginRight: spacing.md, width: 52 },
  heroHeading: { flex: 1 },
  heroTitle: { color: colors.primaryDark, marginTop: spacing.xs },
  heroDescription: { marginTop: spacing.md },
  progressTrack: { backgroundColor: colors.surfaceMuted, borderRadius: 8, height: 10, marginTop: spacing.lg, overflow: "hidden" },
  progressTrackCompact: { height: 7, marginTop: spacing.md },
  progressFill: { backgroundColor: colors.success, borderRadius: 8, height: "100%" },
  group: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, overflow: "hidden" },
  divider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  dayRow: { padding: spacing.lg },
  dayHeader: { alignItems: "center", flexDirection: "row" },
  dayText: { flex: 1, marginRight: spacing.md },
  dayDescription: { marginTop: spacing.xs },
  dayPercentage: { color: colors.primaryDark },
  freeDayLabel: { color: colors.success },
  actionRow: { alignItems: "center", flexDirection: "row", minHeight: 78, padding: spacing.lg },
  actionInfo: { flex: 1, marginRight: spacing.md },
  actionMedication: { marginBottom: spacing.xs },
});
