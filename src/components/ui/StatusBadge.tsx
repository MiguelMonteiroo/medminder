import { StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { colors } from "../../theme/colors";
import { radii } from "../../theme/radii";
import { spacing } from "../../theme/spacing";
import { DoseStatus } from "../../types/domain";

type BadgeStatus = DoseStatus | "active" | "paused";

type Props = {
  status: BadgeStatus;
};

const LABELS: Record<BadgeStatus, string> = {
  pending: "Pendente",
  taken: "Tomada",
  skipped: "Pulada",
  snoozed: "Adiada",
  missed: "Perdida",
  active: "Ativo",
  paused: "Pausado",
};

export function StatusBadge({ status }: Props) {
  return (
    <View style={[styles.badge, styles[status]]}>
      <AppText variant="caption" style={[styles.text, styles[`${status}Text`]]}>
        {LABELS[status]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
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
    backgroundColor: colors.primarySoft,
  },
  snoozedText: {
    color: colors.primary,
  },
  missed: {
    backgroundColor: colors.dangerSoft,
  },
  missedText: {
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
});
