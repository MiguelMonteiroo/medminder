import { StyleSheet, View } from "react-native";
import { AppButton } from "./ui/AppButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = {
  title: string;
  accessibilityLabel: string;
  busy?: boolean;
  onPress: () => void;
};

export function MedicationFormActionBar({
  title,
  accessibilityLabel,
  busy = false,
  onPress,
}: Props) {
  return (
    <View style={styles.container}>
      <AppButton
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ busy, disabled: busy }}
        disabled={busy}
        onPress={onPress}
        title={busy ? "Salvando..." : title}
        variant="primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: spacing.sm,
    paddingTop: spacing.md,
  },
});
