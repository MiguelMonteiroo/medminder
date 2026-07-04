import { Pressable, PressableProps, StyleSheet, ViewStyle } from "react-native";
import { AppText } from "./AppText";
import { colors } from "../../theme/colors";
import { radii } from "../../theme/radii";
import { spacing } from "../../theme/spacing";

type Variant = "primary" | "secondary" | "success" | "warning" | "danger" | "ghost";

type Props = PressableProps & {
  title: string;
  variant?: Variant;
  compact?: boolean;
  style?: ViewStyle;
};

export function AppButton({
  title,
  variant = "primary",
  compact = false,
  style,
  ...props
}: Props) {
  const isGhost = variant === "ghost";

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
      <AppText
        variant="small"
        style={[styles.text, isGhost && styles.ghostText]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {title}
      </AppText>
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
  ghost: {
    backgroundColor: colors.surfaceMuted,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: colors.white,
    fontWeight: "800",
  },
  ghostText: {
    color: colors.text,
  },
});
