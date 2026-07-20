import { Pressable, StyleSheet, View } from "react-native";
import { Check, ChevronRight, Minus, RotateCcw } from "lucide-react-native";
import { AppText } from "./ui/AppText";
import { AppButton } from "./ui/AppButton";
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
  onUndo?: () => void;
  undoing?: boolean;
};

export function CareCompletedDoseRow({
  time,
  name,
  dosage,
  status,
  onPress,
  onUndo,
  undoing = false,
}: Props) {
  const isSkipped = status === "skipped";
  const Icon = isSkipped ? Minus : Check;
  const statusText = isSkipped ? "Pulada" : "Tomada";
  const title = dosage ? `${name} (${dosage})` : name;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.details, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Dose ${statusText.toLowerCase()}: ${title}`}
      >
        <View style={[styles.statusIcon, isSkipped && styles.skippedIcon]}>
          <Icon color={colors.white} size={18} />
        </View>
        <AppText
          weight="semibold"
          style={[styles.time, isSkipped && styles.skippedText]}
        >
          {time}
        </AppText>
        <View style={styles.info}>
          <AppText variant="small" weight="semibold" style={styles.name}>{title}</AppText>
          <AppText
            variant="small"
            style={[styles.statusText, isSkipped && styles.skippedText]}
          >
            {statusText}
          </AppText>
        </View>
      </Pressable>
      {isSkipped && onUndo ? (
        <AppButton
          accessibilityLabel="Desfazer dose pulada"
          disabled={undoing}
          icon={RotateCcw}
          onPress={onUndo}
          size="compact"
          style={styles.undoButton}
          title="Desfazer"
          variant="ghost"
        />
      ) : (
        <ChevronRight color={colors.textMuted} size={20} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 72,
    paddingVertical: spacing.md,
  },
  details: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
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
    fontVariant: ["tabular-nums"],
    marginRight: spacing.md,
    minWidth: 48,
  },
  info: {
    flex: 1,
  },
  name: {
  },
  statusText: {
    color: colors.success,
  },
  skippedText: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.75,
  },
  undoButton: {
    marginLeft: spacing.sm,
  },
});
