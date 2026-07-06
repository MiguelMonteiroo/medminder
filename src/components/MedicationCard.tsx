import { Pressable, StyleSheet, View } from "react-native";
import { Clock3, Info, RotateCcw } from "lucide-react-native";
import { AppButton } from "./ui/AppButton";
import { AppCard } from "./ui/AppCard";
import { AppText } from "./ui/AppText";
import { StatusBadge } from "./ui/StatusBadge";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";
import { DoseStatus } from "../types/domain";

type Props = {
  name: string;
  dosage?: string;
  time: string;
  frequency?: string;
  notes?: string;
  status: DoseStatus;
  onTake: () => void;
  onSkip?: () => void;
  onSnooze?: () => void;
  onPress?: () => void;
};

export function MedicationCard({
  name,
  dosage,
  time,
  frequency,
  notes,
  status,
  onTake,
  onSkip,
  onSnooze,
  onPress,
}: Props) {
  const isTaken = status === "taken";
  const isComplete = status === "taken" || status === "skipped";
  const isPending = status === "pending" || status === "snoozed";

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${name}, ${status}`}
      accessibilityHint="Abre os detalhes do medicamento"
    >
      <AppCard
        style={[
          styles.card,
          isPending && styles.pendingCard,
          isComplete && styles.completedCard,
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <AppText variant="subheading" style={isTaken && styles.takenName}>
              {name}
            </AppText>
            <View style={styles.timeRow}>
              <Clock3 color={colors.textMuted} size={16} />
              <AppText variant="small" muted>
                {time}
              </AppText>
              {dosage ? (
                <AppText variant="small" muted>
                  · {dosage}
                </AppText>
              ) : null}
            </View>
          </View>
          <StatusBadge status={status} />
        </View>

        {frequency ? (
          <AppText variant="small" muted style={styles.detail}>
            Frequência: {frequency}
          </AppText>
        ) : null}
        {notes ? (
          <AppText variant="small" muted style={styles.notes}>
            {notes}
          </AppText>
        ) : null}

        <View style={styles.actions}>
          <AppButton
            title={isTaken ? "Desfazer" : "Tomar"}
            variant={isTaken ? "ghost" : "success"}
            compact
            style={styles.primaryAction}
            onPress={onTake}
            accessibilityLabel={
              isTaken ? "Desfazer dose tomada" : "Marcar dose como tomada"
            }
          />
          {!isComplete ? (
            <>
              <AppButton
                title="Adiar"
                variant="ghost"
                compact
                onPress={onSnooze}
                accessibilityLabel="Adiar dose por alguns minutos"
              />
              <AppButton
                title="Pular"
                variant="ghost"
                compact
                onPress={onSkip}
                accessibilityLabel="Registrar dose como pulada"
              />
            </>
          ) : null}
          <AppButton
            title="Detalhes"
            variant="ghost"
            compact
            onPress={onPress}
            accessibilityLabel="Ver detalhes do medicamento"
          />
        </View>

        {!isComplete ? (
          <View style={styles.hintRow}>
            <Info color={colors.textMuted} size={14} />
            <AppText variant="caption" muted>
              Ação rápida para a dose de hoje
            </AppText>
          </View>
        ) : (
          <View style={styles.hintRow}>
            <RotateCcw color={colors.textMuted} size={14} />
            <AppText variant="caption" muted>
              Você pode desfazer se registrou por engano
            </AppText>
          </View>
        )}
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  pendingCard: {
    borderColor: colors.primary,
  },
  completedCard: {
    opacity: 0.82,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  titleBlock: {
    flex: 1,
    marginRight: spacing.md,
  },
  takenName: {
    color: colors.success,
  },
  timeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  detail: {
    marginTop: spacing.sm,
  },
  notes: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryAction: {
    minWidth: 104,
  },
  hintRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
});
