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
  size?: "default" | "compact";
  /** @deprecated Use size="compact". */
  compact?: boolean;
  icon?: LucideIcon;
  style?: ViewStyle;
};

export function AppButton({
  title,
  variant = "primary",
  size = "default",
  compact = false,
  icon: Icon,
  style,
  disabled,
  ...props
}: Props) {
  const isCompact = compact || size === "compact";
  const isGhost = variant === "ghost";
  const isDangerSoft = variant === "dangerSoft";
  const usesDarkForeground = ["secondary", "success", "warning"].includes(variant);
  const iconColor = isDangerSoft
    ? colors.danger
    : isGhost
    ? colors.primary
    : usesDarkForeground
    ? colors.text
    : colors.white;

  return (
    <Pressable
      {...props}
      accessibilityRole={props.accessibilityRole ?? "button"}
      accessibilityState={{
        ...props.accessibilityState,
        disabled: Boolean(disabled),
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        isCompact && styles.compact,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {Icon ? <Icon color={iconColor} size={18} strokeWidth={2.4} /> : null}
        <AppText
          variant="small"
          weight="bold"
          style={[
            styles.text,
            isGhost && styles.ghostText,
            isDangerSoft && styles.dangerSoftText,
            usesDarkForeground && styles.darkText,
          ]}
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
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  compact: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minWidth: 0,
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
    borderColor: colors.dangerBorder,
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
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.white,
    flexShrink: 1,
    textAlign: "center",
  },
  ghostText: {
    color: colors.primary,
  },
  dangerSoftText: {
    color: colors.danger,
  },
  darkText: {
    color: colors.text,
  },
});
