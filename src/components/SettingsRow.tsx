import { StyleSheet, Switch, View } from "react-native";
import { AlertCircle, CheckCircle2, type LucideIcon } from "lucide-react-native";
import { AppButton } from "./ui/AppButton";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  state: string;
  stateTone?: "positive" | "attention" | "neutral";
  actionLabel?: string;
  onAction?: () => void;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  disabled?: boolean;
  last?: boolean;
};

export function SettingsRow({
  icon: Icon,
  title,
  description,
  state,
  stateTone = "neutral",
  actionLabel,
  onAction,
  switchValue,
  onSwitchChange,
  disabled = false,
  last = false,
}: Props) {
  const StateIcon = stateTone === "positive" ? CheckCircle2 : AlertCircle;

  return (
    <View style={[styles.row, !last && styles.divider, disabled && styles.disabled]}>
      <View style={styles.iconWrap}>
        <Icon color={colors.primaryDark} size={23} strokeWidth={2} />
      </View>
      <View style={styles.copy}>
        <AppText variant="small" weight="semibold">{title}</AppText>
        <AppText variant="caption" muted style={styles.description}>{description}</AppText>
        <View style={styles.stateRow}>
          <StateIcon
            color={stateTone === "positive" ? colors.success : stateTone === "attention" ? colors.warning : colors.textMuted}
            size={16}
            strokeWidth={2}
          />
          <AppText
            variant="caption"
            weight="semibold"
            style={stateTone === "positive" ? styles.positive : stateTone === "attention" ? styles.attention : styles.neutral}
          >
            {state}
          </AppText>
        </View>
        {actionLabel && onAction ? (
          <AppButton
            disabled={disabled}
            onPress={onAction}
            size="compact"
            style={styles.action}
            title={actionLabel}
            variant="ghost"
          />
        ) : null}
      </View>
      {typeof switchValue === "boolean" && onSwitchChange ? (
        <Switch
          accessibilityLabel={title}
          accessibilityState={{ checked: switchValue, disabled }}
          disabled={disabled}
          onValueChange={onSwitchChange}
          thumbColor={switchValue ? colors.primary : colors.surface}
          trackColor={{ false: colors.surfaceMuted, true: colors.primarySoft }}
          value={switchValue}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "flex-start", flexDirection: "row", paddingVertical: spacing.lg },
  divider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  disabled: { opacity: 0.58 },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 44,
  },
  copy: { flex: 1, marginRight: spacing.sm },
  description: { marginTop: spacing.xs },
  stateRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm },
  positive: { color: colors.success },
  attention: { color: colors.warning },
  neutral: { color: colors.textMuted },
  action: { alignSelf: "flex-start", marginTop: spacing.md },
});
