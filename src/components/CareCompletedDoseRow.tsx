import { Pressable, StyleSheet, View } from "react-native";
import { Check, ChevronRight, Minus } from "lucide-react-native";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";
import { DoseStatus } from "../types/domain";

type Props = {
  time: string;
  name: string;
  dosage?: string;
  status: Extract<DoseStatus, "taken" | "skipped">;
  onPress?: () => void;
};

export function CareCompletedDoseRow({
  time,
  name,
  dosage,
  status,
  onPress,
}: Props) {
  const isSkipped = status === "skipped";
  const Icon = isSkipped ? Minus : Check;
  const statusText = isSkipped ? "Pulada" : "Tomada";
  const title = dosage ? `${name} (${dosage})` : name;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Dose ${statusText.toLowerCase()}: ${title}`}
    >
      <View style={[styles.statusIcon, isSkipped && styles.skippedIcon]}>
        <Icon color={colors.white} size={18} />
      </View>
      <AppText style={[styles.time, isSkipped && styles.skippedText]}>{time}</AppText>
      <View style={styles.info}>
        <AppText style={styles.name}>{title}</AppText>
        <AppText
          variant="small"
          style={[styles.statusText, isSkipped && styles.skippedText]}
        >
          {statusText}
        </AppText>
      </View>
      <ChevronRight color={colors.textMuted} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 64,
    paddingVertical: spacing.md,
  },
  statusIcon: {
    alignItems: "center",
    backgroundColor: colors.success,
    borderRadius: radii.pill,
    height: 32,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 32,
  },
  skippedIcon: {
    backgroundColor: colors.danger,
  },
  time: {
    color: colors.success,
    fontWeight: "800",
    marginRight: spacing.md,
    minWidth: 48,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: "700",
  },
  statusText: {
    color: colors.success,
    fontWeight: "700",
  },
  skippedText: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.75,
  },
});
