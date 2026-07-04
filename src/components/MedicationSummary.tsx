import { StyleSheet, View } from "react-native";
import { Clock3 } from "lucide-react-native";
import { AppCard } from "./ui/AppCard";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radii } from "../theme/radii";

type Props = {
  takenCount: number;
  totalCount: number;
  nextDoseTime?: string;
};

export function MedicationSummary({ takenCount, totalCount, nextDoseTime }: Props) {
  const pending = Math.max(totalCount - takenCount, 0);
  const progress = totalCount === 0 ? 0 : takenCount / totalCount;
  const progressText =
    totalCount > 0 && pending === 0 ? "Tudo em dia" : `${takenCount}/${totalCount}`;

  return (
    <AppCard style={styles.container}>
      <View style={styles.header}>
        <View style={styles.info}>
          <AppText variant="caption" muted>
            Seu dia com medicamentos
          </AppText>
          <AppText variant="heading" style={styles.title}>
            {progressText}
          </AppText>
          <AppText muted>
            {totalCount === 0
              ? "Cadastre um medicamento para começar."
              : pending === 0
              ? "Todas as doses de hoje foram registradas."
              : `${pending} dose${pending > 1 ? "s" : ""} pendente${pending > 1 ? "s" : ""}.`}
          </AppText>
        </View>

        <View style={styles.nextDose}>
          <Clock3 color={colors.primary} size={18} />
          <AppText variant="caption" muted>
            Próxima
          </AppText>
          <AppText variant="small" style={styles.nextDoseText}>
            {nextDoseTime || "--:--"}
          </AppText>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  nextDose: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    minWidth: 82,
    padding: spacing.md,
  },
  nextDoseText: {
    color: colors.primary,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  progressTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    height: 8,
    marginTop: spacing.lg,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.success,
    borderRadius: radii.pill,
    height: "100%",
  },
});
