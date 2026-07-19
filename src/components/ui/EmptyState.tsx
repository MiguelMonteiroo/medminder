import { StyleSheet, View } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { AppText } from "./AppText";
import { AppButton } from "./AppButton";
import { colors } from "../../theme/colors";
import { radii } from "../../theme/radii";
import { spacing } from "../../theme/spacing";

type Props = {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  illustration?: React.ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  actionIcon,
  onAction,
  illustration,
}: Props) {
  return (
    <View style={styles.container}>
      {illustration ?? (
        <View style={styles.iconWrap}>
          <Icon color={colors.primary} size={32} strokeWidth={2} />
        </View>
      )}
      <AppText variant="subheading" style={styles.title}>
        {title}
      </AppText>
      <AppText muted style={styles.message}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <AppButton
          accessibilityLabel={actionLabel}
          icon={actionIcon}
          onPress={onAction}
          style={styles.action}
          title={actionLabel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 56,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: 56,
  },
  title: {
    textAlign: "center",
  },
  message: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
  action: {
    marginTop: spacing.xl,
    width: "100%",
  },
});
