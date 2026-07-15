import { Pressable, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = {
  step: number;
  title: string;
  icon?: LucideIcon;
  optional?: boolean;
  expanded: boolean;
  onPress: () => void;
  children: ReactNode;
};

export function CareAccordionStepCard({
  step,
  title,
  icon: StepIcon,
  optional,
  expanded,
  onPress,
  children,
}: Props) {
  const Chevron = expanded ? ChevronUp : ChevronDown;

  return (
    <View style={[styles.card, expanded && styles.expandedCard]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? "Fechar" : "Abrir"} etapa ${step}: ${title}`}
        accessibilityState={{ expanded }}
        onPress={onPress}
        style={styles.header}
      >
        <View style={[styles.stepBadge, StepIcon && styles.stepBadgeWithIcon]}>
          {StepIcon ? (
            <StepIcon color={colors.white} size={15} strokeWidth={2.5} />
          ) : null}
          <AppText style={styles.stepText}>{step}</AppText>
        </View>
        <AppText variant="subheading" style={styles.title}>
          {title}
          {optional ? <AppText> (opcional)</AppText> : null}
        </AppText>
        <Chevron color={colors.text} size={20} />
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  expandedCard: {
    borderColor: "#D8CBB8",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 58,
    paddingHorizontal: spacing.lg,
  },
  stepBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    flexDirection: "row",
    height: 34,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 34,
  },
  stepBadgeWithIcon: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    width: 58,
  },
  stepText: {
    color: colors.white,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    flex: 1,
  },
  content: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.lg,
  },
});
