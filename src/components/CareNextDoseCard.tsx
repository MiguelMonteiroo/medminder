import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight, Clock3 } from "lucide-react-native";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = { time: string; name?: string; dosage?: string; onPress?: () => void };

export function CareNextDoseCard({ time, name, dosage, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? "Ver detalhes da próxima dose" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.heading}>
        <Clock3 color={colors.accent} size={20} strokeWidth={2} />
        <AppText variant="small" weight="bold" style={styles.headingText}>Próxima dose</AppText>
      </View>
      <View style={styles.content}>
        <AppText
          ellipsizeMode="clip"
          numberOfLines={1}
          variant="heading"
          style={styles.time}
        >
          {time}
        </AppText>
        <View style={styles.info}>
          <AppText variant="small" weight="bold">{name || "Nenhuma dose pendente"}</AppText>
          <AppText variant="caption" muted>{dosage || "Sem dosagem informada"}</AppText>
        </View>
        {onPress ? <ChevronRight color={colors.accent} size={24} strokeWidth={2} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder, borderRadius: radii.md, borderWidth: 1, padding: spacing.lg },
  heading: { alignItems: "center", flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  headingText: { color: colors.accent },
  content: { alignItems: "center", flexDirection: "row" },
  time: {
    color: colors.accent,
    flexShrink: 0,
    fontVariant: ["tabular-nums"],
    marginRight: spacing.md,
    textAlign: "center",
    width: 108,
  },
  info: { flex: 1, marginRight: spacing.sm },
  pressed: { opacity: 0.78 },
});
