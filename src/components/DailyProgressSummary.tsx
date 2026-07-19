import { StyleSheet, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { AppCard } from "./ui/AppCard";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = {
  taken: number;
  total: number;
  label: string;
  supportLabel: string;
};

export function DailyProgressSummary({ taken, total, label, supportLabel }: Props) {
  const progress = total === 0 ? 0 : Math.max(0, Math.min(1, taken / total));

  return (
    <AppCard accessibilityLabel={`${label}. ${supportLabel}`} accessible style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <AppText variant="caption" muted>Progresso de hoje</AppText>
          <AppText variant="subheading" weight="bold" style={styles.label}>{label}</AppText>
        </View>
        <View style={styles.countBubble}>
          <AppText variant="small" weight="bold" style={styles.countText}>{taken}/{total}</AppText>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <View style={styles.supportRow}>
        <CheckCircle2 color={colors.primaryMuted} size={19} strokeWidth={2} />
        <AppText variant="small" muted style={styles.supportText}>{supportLabel}</AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  headingRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  headingCopy: { flex: 1, marginRight: spacing.md },
  label: { color: colors.primaryDark, marginTop: spacing.xs },
  countBubble: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 56,
    paddingHorizontal: spacing.sm,
  },
  countText: { color: colors.primaryDark },
  track: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 10,
    marginTop: spacing.lg,
    overflow: "hidden",
  },
  fill: { backgroundColor: colors.primary, borderRadius: 8, height: "100%", minWidth: 0 },
  supportRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  supportText: { flex: 1 },
});
