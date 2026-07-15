import { StyleSheet, View } from "react-native";
import { Circle, type LucideIcon } from "lucide-react-native";
import { AppText } from "./AppText";
import { colors } from "../../theme/colors";
import { radii } from "../../theme/radii";
import { spacing } from "../../theme/spacing";
import { DoseStatus } from "../../types/domain";

export type BadgeStatus = DoseStatus | "active" | "paused" | "undone";

type Props = {
  status: BadgeStatus;
};

const LABELS: Record<BadgeStatus, string> = {
  pending: "Pendente",
  taken: "Tomada",
  skipped: "Pulada",
  snoozed: "Adiada",
  unrecorded: "Não registrada",
  active: "Ativo",
  paused: "Pausado",
  undone: "Desfeita",
};

const ICON_COLORS: Record<BadgeStatus, string> = {
  pending: colors.warning,
  taken: colors.success,
  skipped: colors.danger,
  snoozed: colors.info,
  unrecorded: colors.danger,
  active: colors.success,
  paused: colors.warning,
  undone: colors.textMuted,
};

export function StatusBadge({ status }: Props) {
  const Icon: LucideIcon = Circle;

  return (
    <View style={[styles.badge, styles[status]]}>
      <Icon
        color={ICON_COLORS[status]}
        fill={ICON_COLORS[status]}
        size={8}
        strokeWidth={0}
      />
      <AppText variant="caption" style={[styles.text, styles[`${status}Text`]]}>
        {LABELS[status]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontWeight: "800",
  },
  pending: {
    backgroundColor: colors.warningSoft,
  },
  pendingText: {
    color: colors.warning,
  },
  taken: {
    backgroundColor: colors.successSoft,
  },
  takenText: {
    color: colors.success,
  },
  skipped: {
    backgroundColor: colors.dangerSoft,
  },
  skippedText: {
    color: colors.danger,
  },
  snoozed: {
    backgroundColor: colors.infoSoft,
  },
  snoozedText: {
    color: colors.info,
  },
  unrecorded: {
    backgroundColor: colors.dangerSoft,
  },
  unrecordedText: {
    color: colors.danger,
  },
  active: {
    backgroundColor: colors.successSoft,
  },
  activeText: {
    color: colors.success,
  },
  paused: {
    backgroundColor: colors.warningSoft,
  },
  pausedText: {
    color: colors.warning,
  },
  undone: {
    backgroundColor: colors.surfaceMuted,
  },
  undoneText: {
    color: colors.textMuted,
  },
});
