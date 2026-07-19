import { Pressable, StyleSheet, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

const MIN_INTERVAL = 1;
const MAX_INTERVAL = 24;
const QUICK_INTERVALS = [4, 6, 8, 12];

export function IntervalHoursPicker({ value, onChange }: Props) {
  const safeValue = clampInterval(value);

  function update(nextValue: number) {
    onChange(clampInterval(nextValue));
  }

  return (
    <View
      accessibilityLabel={`Intervalo de ${safeValue} em ${safeValue} horas`}
      accessibilityRole="adjustable"
      style={styles.container}
    >
      <View style={styles.stepper}>
        <StepButton
          label="Diminuir intervalo"
          disabled={safeValue <= MIN_INTERVAL}
          onPress={() => update(safeValue - 1)}
          icon={Minus}
        />
        <View style={styles.valueBox}>
          <AppText variant="title" weight="bold" style={styles.value}>
            {safeValue}
          </AppText>
          <AppText variant="small" muted>
            {safeValue === 1 ? "hora" : "horas"}
          </AppText>
        </View>
        <StepButton
          label="Aumentar intervalo"
          disabled={safeValue >= MAX_INTERVAL}
          onPress={() => update(safeValue + 1)}
          icon={Plus}
        />
      </View>

      <View style={styles.quickRow}>
        {QUICK_INTERVALS.map((interval) => {
          const active = interval === safeValue;

          return (
            <Pressable
              key={interval}
              accessibilityRole="button"
              accessibilityLabel={`Usar intervalo de ${interval} horas`}
              onPress={() => update(interval)}
              style={({ pressed }) => [
                styles.quickButton,
                active && styles.quickButtonActive,
                pressed && styles.pressed,
              ]}
            >
              <AppText
                variant="small"
                weight="bold"
                style={[styles.quickText, active && styles.quickTextActive]}
              >
                {interval}h
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type StepButtonProps = {
  label: string;
  disabled: boolean;
  onPress: () => void;
  icon: typeof Minus;
};

function StepButton({ label, disabled, onPress, icon: Icon }: StepButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Icon color={disabled ? colors.textMuted : colors.primaryDark} size={22} />
    </Pressable>
  );
}

function clampInterval(value: number) {
  if (!Number.isFinite(value)) return 8;
  return Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, Math.round(value)));
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  stepper: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.controlBorder,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 104,
    padding: spacing.md,
  },
  stepButton: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
  valueBox: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  value: {
    color: colors.primaryDark,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    minWidth: 58,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  quickButtonActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSelectionBorder,
  },
  quickText: {
    color: colors.primary,
  },
  quickTextActive: {
    color: colors.primaryDark,
  },
});
