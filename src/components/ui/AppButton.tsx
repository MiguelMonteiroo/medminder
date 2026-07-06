import { Pressable, PressableProps, StyleSheet, View, ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { AppText } from "./AppText";
import { colors } from "../../theme/colors";
import { radii } from "../../theme/radii";
import { spacing } from "../../theme/spacing";

type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "dangerSoft"
  | "ghost";

type Props = PressableProps & {
  title: string;
  variant?: Variant;
  compact?: boolean;
  icon?: LucideIcon;
  style?: ViewStyle;
};

export function AppButton({
  title,
  variant = "primary",
  compact = false,
  icon: Icon,
  style,
  ...props
}: Props) {
  const isGhost = variant === "ghost";
  const isDangerSoft = variant === "dangerSoft";
  const iconColor = isDangerSoft
    ? colors.danger
    : isGhost
    ? colors.primary
    : colors.white;

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        styles[variant],
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>
        {Icon ? <Icon color={iconColor} size={18} strokeWidth={2.4} /> : null}
        <AppText
          variant="small"
          style={[
            styles.text,
            isGhost && styles.ghostText,
            isDangerSoft && styles.dangerSoftText,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {title}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  compact: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.accent,
  },
  success: {
    backgroundColor: colors.success,
  },
  warning: {
    backgroundColor: colors.warning,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  dangerSoft: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#E9A39E",
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: colors.white,
    fontWeight: "800",
  },
  ghostText: {
    color: colors.primary,
  },
  dangerSoftText: {
    color: colors.danger,
  },
});
