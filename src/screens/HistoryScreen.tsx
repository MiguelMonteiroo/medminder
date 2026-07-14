import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { BarChart3 } from "lucide-react-native";
import { AppCard } from "../components/ui/AppCard";
import { AppText } from "../components/ui/AppText";
import { EmptyState } from "../components/ui/EmptyState";
import { Screen } from "../components/ui/Screen";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAppData } from "../services/appDataProvider";
import { calculateAdherence, getLast7Days } from "../utils/stats";
import { DoseLog, DoseStatus } from "../types/domain";
import { generateDoseOccurrencesForDate } from "../utils/doseEngine";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export function HistoryScreen() {
  const { medications, schedules, doseLogs: logs, loading } = useAppData();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  let totalDoses = 0;
  for (const med of medications) {
    for (const sched of schedules.filter((s) => s.medicationId === med.id)) {
      totalDoses += generateDoseOccurrencesForDate(med, sched, todayStr).length;
    }
  }

  const adherence = calculateAdherence(logs, totalDoses);
  const last7Days = getLast7Days();
  const recentLogs = logs.slice(0, 10);

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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

        <AppCard style={styles.heroCard}>
          <AppText variant="caption" muted>
            Adesão de hoje
          </AppText>
          <AppText variant="title" style={styles.percentage}>
            {adherence.percentage}%
          </AppText>
          <AppText muted>
            {adherence.taken} de {adherence.total} doses tomadas
          </AppText>
        </AppCard>

        <SectionHeader title="Últimos 7 dias" />
        <AppCard style={styles.card}>
          {last7Days.map((day) => (
            <View key={day} style={styles.dayRow}>
              <AppText>{day}</AppText>
              <AppText muted>Resumo em breve</AppText>
            </View>
          ))}
        </AppCard>

        <SectionHeader title="Últimas ações" />
        {recentLogs.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Sem histórico ainda"
            message="As doses tomadas, puladas ou adiadas aparecerão aqui."
          />
        ) : (
          <AppCard style={styles.card}>
            {recentLogs.map((log) => {
              const med = medications.find((m) => m.id === log.medicationId);
              return (
                <View key={log.id} style={styles.logRow}>
                  <View style={styles.logInfo}>
                    <AppText style={styles.logMed}>
                      {med?.name || "Medicamento removido"}
                    </AppText>
                    <AppText variant="caption" muted>
                      {log.actionAt.substring(11, 16)}
                    </AppText>
                  </View>
                  <StatusBadge status={actionToStatus(log.action)} />
                </View>
              );
            })}
          </AppCard>
        )}
      </ScrollView>
    </Screen>
  );
}

function actionToStatus(action: DoseLog["action"]): DoseStatus {
  if (action === "taken") return "taken";
  if (action === "skipped") return "skipped";
  if (action === "snoozed") return "snoozed";
  return "pending";
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  heroCard: {
    marginBottom: spacing.md,
  },
  percentage: {
    color: colors.success,
    marginVertical: spacing.xs,
  },
  card: {
    marginBottom: spacing.md,
  },
  dayRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  logRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingVertical: spacing.md,
  },
  logInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  logMed: {
    fontWeight: "700",
  },
});
