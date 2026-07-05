import { Pressable, StyleSheet, View } from "react-native";
import { Check, ChevronRight } from "lucide-react-native";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = {
  time: string;
  name: string;
  dosage?: string;
  onPress?: () => void;
};

export function CareCompletedDoseRow({ time, name, dosage, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Dose concluída: ${name}`}
    >
      <View style={styles.check}>
        <Check color={colors.white} size={18} />
      </View>
      <AppText style={styles.time}>{time}</AppText>
      <View style={styles.info}>
        <AppText style={styles.name}>{name}</AppText>
        <AppText variant="small" muted>
          {dosage || "Dose registrada"}
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
  check: {
    alignItems: "center",
    backgroundColor: colors.success,
    borderRadius: radii.pill,
    height: 32,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 32,
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
  pressed: {
    opacity: 0.75,
  },
});
