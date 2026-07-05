import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Clock3, HeartPulse } from "lucide-react-native";
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
  const size = 92;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference * (1 - progress);
  const progressText =
    totalCount > 0 && pending === 0 ? "Tudo em dia" : `${takenCount}/${totalCount}`;

  return (
    <AppCard style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressCircle}>
          <Svg height={size} width={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.surfaceMuted}
              strokeWidth={stroke}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.success}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          <View style={styles.progressCenter}>
            <HeartPulse color={colors.primary} size={18} />
            <AppText variant="caption" style={styles.progressLabel}>
              {progressText}
            </AppText>
          </View>
        </View>

        <View style={styles.info}>
          <AppText variant="caption" muted>
            Seu cuidado de hoje
          </AppText>
          <AppText variant="heading" style={styles.title}>
            {pending === 0 && totalCount > 0 ? "Tudo em dia" : "Vamos com calma"}
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
  progressCircle: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.lg,
  },
  progressCenter: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  progressLabel: {
    color: colors.primary,
    fontWeight: "800",
    marginTop: spacing.xs,
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
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    minWidth: 82,
    padding: spacing.md,
  },
  nextDoseText: {
    color: colors.text,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
});
