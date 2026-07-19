import { StyleSheet, View } from "react-native";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = {
  title: string;
  subtitle: string;
  initials?: string;
};

export function CareHeader({ title, subtitle, initials = "M" }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.text}>
        <AppText variant="title" style={styles.title}>
          {title}
        </AppText>
        <AppText muted>{subtitle}</AppText>
      </View>
      <View style={styles.avatar}>
        <AppText weight="bold" style={styles.avatarText}>{initials}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  text: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  avatarText: {
    color: colors.primaryDark,
  },
});
