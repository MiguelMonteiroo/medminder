import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useAppData } from "../services/appDataProvider";
import { createDoseLogRepository } from "../database/repositories/doseLogRepository";
import { calculateAdherence, getLast7Days } from "../utils/stats";
import { DoseLog } from "../types/domain";
import { generateDoseOccurrencesForDate } from "../utils/doseEngine";

export function HistoryScreen() {
  const { medications, schedules } = useAppData();
  const db = useSQLiteContext();
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const repo = createDoseLogRepository(db);
      const allLogs = await repo.getAll();
      setLogs(allLogs);
      setLoading(false);
    }
    load();
  }, [db]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  let totalDoses = 0;
  for (const med of medications) {
    for (const sched of schedules.filter((s) => s.medicationId === med.id)) {
      const occs = generateDoseOccurrencesForDate(med, sched, todayStr);
      totalDoses += occs.length;
    }
  }

  const adherence = calculateAdherence(logs, totalDoses);
  const last7Days = getLast7Days();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico e Estatísticas</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Adesão de Hoje</Text>
        <Text style={styles.percentage}>{adherence.percentage}%</Text>
        <Text style={styles.subtext}>
          {adherence.taken} de {adherence.total} doses tomadas
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Últimos 7 Dias</Text>
        {last7Days.map((day) => (
          <View key={day} style={styles.dayRow}>
            <Text style={styles.dayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Últimas Ações</Text>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma ação registrada.</Text>
        ) : (
          logs
            .filter((_, i) => i < 10)
            .map((log) => {
              const med = medications.find((m) => m.id === log.medicationId);
              return (
                <View key={log.id} style={styles.logRow}>
                  <Text style={styles.logAction}>
                    {log.action === "taken"
                      ? "Tomado"
                      : log.action === "skipped"
                      ? "Pulado"
                      : log.action === "snoozed"
                      ? "Adiado"
                      : "Desfeito"}
                  </Text>
                  <Text style={styles.logMed}>
                    {med?.name || "Desconhecido"}
                  </Text>
                  <Text style={styles.logTime}>
                    {log.actionAt.substring(11, 16)}
                  </Text>
                </View>
              );
            })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  percentage: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#16A34A",
  },
  subtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  dayRow: {
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    color: "#555",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  logAction: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
  },
  logMed: {
    fontSize: 14,
    color: "#555",
    flex: 2,
    textAlign: "center",
  },
  logTime: {
    fontSize: 14,
    color: "#9CA3AF",
    flex: 1,
    textAlign: "right",
  },
});
