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
  },
  title: {
    fontSize: typography.title,
    fontWeight: "800",
  },
  heading: {
    fontSize: typography.heading,
    fontWeight: "700",
  },
  subheading: {
    fontSize: typography.subheading,
    fontWeight: "700",
  },
  body: {
    fontSize: typography.body,
  },
  small: {
    fontSize: typography.small,
  },
  caption: {
    fontSize: typography.caption,
    fontWeight: "600",
  },
  muted: {
    color: colors.textMuted,
  },
});
