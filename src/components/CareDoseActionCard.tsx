import { Pressable, StyleSheet, View } from "react-native";
import { Clock3, SkipForward } from "lucide-react-native";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = {
  time: string;
  name: string;
  dosage?: string;
  snoozeMinutes?: number;
  onTake: () => void;
  onSnooze?: () => void;
  onSkip?: () => void;
  onPress?: () => void;
};

export function CareDoseActionCard({
  time,
  name,
  dosage,
  snoozeMinutes = 5,
  onTake,
  onSnooze,
  onSkip,
  onPress,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver detalhes de ${name}`}
          onPress={onPress}
          style={styles.detailsArea}
        >
          <View style={styles.timePane}>
            <AppText variant="subheading" style={styles.time}>
              {time}
            </AppText>
          </View>
          <View style={styles.info}>
            <AppText variant="small" weight="bold" style={styles.name}>{name}</AppText>
            <AppText variant="small" muted>
              {dosage || "Dose programada"}
            </AppText>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Marcar dose como tomada"
          onPress={onTake}
          style={({ pressed }) => [styles.takeButton, pressed && styles.pressed]}
        >
          <AppText variant="small" weight="bold" style={styles.takeText}>Tomar</AppText>
        </Pressable>
      </View>

      <View style={styles.secondaryActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Adiar dose por ${snoozeMinutes} minutos`}
          onPress={onSnooze}
          style={styles.secondaryButton}
        >
          <Clock3 color={colors.primaryDark} size={19} strokeWidth={2} />
          <AppText variant="small" style={styles.secondaryText}>
            Adiar {snoozeMinutes} min
          </AppText>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pular dose"
          onPress={onSkip}
          style={styles.secondaryButton}
        >
          <SkipForward color={colors.primaryDark} size={19} strokeWidth={2} />
          <AppText variant="small" style={styles.secondaryText}>
            Pular dose
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  main: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 88,
  },
  detailsArea: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minHeight: 88,
  },
  timePane: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.accentSoft,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    width: 82,
  },
  time: {
    color: colors.accent,
  },
  info: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  name: {
  },
  takeButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    justifyContent: "center",
    marginRight: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  takeText: {
    color: colors.white,
  },
  secondaryActions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    minHeight: 52,
  },
  secondaryButton: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  secondaryText: {
    color: colors.primaryDark,
  },
  divider: {
    backgroundColor: colors.border,
    width: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});
