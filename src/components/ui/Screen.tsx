import { SafeAreaView, StyleSheet, ViewProps } from "react-native";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

export function Screen({ style, ...props }: ViewProps) {
  return <SafeAreaView {...props} style={[styles.screen, style]} />;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
});
