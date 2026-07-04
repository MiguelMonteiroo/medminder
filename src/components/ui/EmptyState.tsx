import { StyleSheet, View } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { AppText } from "./AppText";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

type Props = {
  icon: LucideIcon;
  title: string;
  message: string;
};

export function EmptyState({ icon: Icon, title, message }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon color={colors.primary} size={28} strokeWidth={2.4} />
      </View>
      <AppText variant="subheading" style={styles.title}>
        {title}
      </AppText>
      <AppText muted style={styles.message}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
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
});
