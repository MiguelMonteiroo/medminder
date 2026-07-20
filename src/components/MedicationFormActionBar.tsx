import { StyleSheet, View } from "react-native";
import { AppButton } from "./ui/AppButton";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = {
  title: string;
  accessibilityLabel: string;
  busy?: boolean;
  error?: string;
  onPress: () => void;
};

export function MedicationFormActionBar({
  title,
  accessibilityLabel,
  busy = false,
  error,
  onPress,
}: Props) {
  return (
    <View style={styles.container}>
      {error ? (
        <AppText
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          variant="small"
          style={styles.error}
        >
          {error}
        </AppText>
      ) : null}
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
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
});
