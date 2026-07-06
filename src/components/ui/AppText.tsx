import { Text, TextProps, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Variant = "title" | "heading" | "subheading" | "body" | "small" | "caption";

type Props = TextProps & {
  variant?: Variant;
  muted?: boolean;
};

export function AppText({ variant = "body", muted = false, style, ...props }: Props) {
  return (
    <Text
      {...props}
      style={[styles.base, styles[variant], muted && styles.muted, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
    lineHeight: 22,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "800",
    lineHeight: 36,
  },
  heading: {
    fontSize: typography.heading,
    fontWeight: "700",
    lineHeight: 30,
  },
  subheading: {
    fontSize: typography.subheading,
    fontWeight: "700",
    lineHeight: 24,
  },
  body: {
    fontSize: typography.body,
  },
  small: {
    fontSize: typography.small,
    lineHeight: 20,
  },
  caption: {
    fontSize: typography.caption,
    fontWeight: "600",
    lineHeight: 18,
  },
  muted: {
    color: colors.textMuted,
  },
});
