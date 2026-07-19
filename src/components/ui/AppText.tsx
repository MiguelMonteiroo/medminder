import { Text, TextProps, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies, typography } from "../../theme/typography";

type Variant =
  | "display"
  | "title"
  | "heading"
  | "subheading"
  | "body"
  | "small"
  | "caption";

type Weight = keyof typeof fontFamilies;

type Props = TextProps & {
  variant?: Variant;
  weight?: Weight;
  muted?: boolean;
};

export function AppText({
  variant = "body",
  weight,
  muted = false,
  style,
  maxFontSizeMultiplier = 1.5,
  ...props
}: Props) {
  const resolvedWeight = weight ?? DEFAULT_WEIGHTS[variant];

  return (
    <Text
      {...props}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        styles.base,
        typography[variant],
        { fontFamily: fontFamilies[resolvedWeight] },
        muted && styles.muted,
        style,
      ]}
    />
  );
}

const DEFAULT_WEIGHTS: Record<Variant, Weight> = {
  display: "bold",
  title: "bold",
  heading: "bold",
  subheading: "semibold",
  body: "regular",
  small: "regular",
  caption: "medium",
};

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
  muted: {
    color: colors.textMuted,
  },
});
