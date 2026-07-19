import { StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { spacing } from "../../theme/spacing";
import { colors } from "../../theme/colors";

type Props = {
  title: string;
  meta?: string;
};

export function SectionHeader({ title, meta }: Props) {
  return (
    <View style={styles.row}>
      <AppText variant="subheading" weight="semibold" style={styles.title}>
        {title}
      </AppText>
      {meta ? (
        <AppText variant="caption" muted>
          {meta}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  title: {
    color: colors.primary,
  },
});
