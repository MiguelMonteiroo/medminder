import { View, Text, StyleSheet } from "react-native";

type Props = {
  takenCount: number;
  totalCount: number;
};

export function MedicationSummary({ takenCount, totalCount }: Props) {
  const pending = totalCount - takenCount;
  const progress = totalCount === 0 ? 0 : takenCount / totalCount;
  const progressText =
    totalCount > 0 && pending === 0
      ? "Tudo em dia"
      : `${takenCount}/${totalCount}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.label}>Tomados hoje</Text>
          <Text style={styles.subtitle}>Progresso dos medicamentos</Text>
        </View>

        <View style={styles.status}>
          <Text style={[styles.count, totalCount === 0 && styles.emptyCount]}>
            {progressText}
          </Text>

          {pending ? (
            <Text style={styles.pendingText}>{pending} pendentes.</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` },
          ]}
        >
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,

    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  count: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#16A34A",
    textAlign: "right",
  },
  emptyCount: {
    color: "#6B7280",
  },
  status: {
    alignItems: "flex-end",
    minWidth: 96,
  },
  pendingText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "right",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#16A34A",
    borderRadius: 999,
  },
  emptyProgressFill: {
    backgroundColor: "#9CA3AF",
  },
});
