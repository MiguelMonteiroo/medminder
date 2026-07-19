import { Pressable, StyleSheet, View } from "react-native";
import { Pill } from "lucide-react-native";
import { AppText } from "./ui/AppText";
import { StatusBadge } from "./ui/StatusBadge";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = {
  name: string;
  dosage: string;
  description?: string;
  paused: boolean;
  onEdit?: () => void;
};

export function CareDetailHeroCard({
  name,
  dosage,
  description,
  paused,
  onEdit,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Pill color={colors.primary} size={34} />
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <AppText variant="heading" weight="bold" style={styles.name}>
            {name}
          </AppText>
          <StatusBadge status={paused ? "paused" : "active"} />
        </View>
        <AppText variant="small" weight="semibold" style={styles.dosage}>{dosage}</AppText>
        {onEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar medicamento"
            onPress={onEdit}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          >
            <AppText variant="small" weight="bold" style={styles.editText}>
              Editar
            </AppText>
          </Pressable>
        ) : null}
        {description ? (
          <AppText muted style={styles.description}>
            {description}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 76,
    justifyContent: "center",
    marginRight: spacing.lg,
    width: 76,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  name: {
    color: colors.primaryDark,
    flex: 1,
  },
  dosage: {
    marginTop: spacing.xs,
  },
  editButton: {
    alignSelf: "flex-start",
    minHeight: 48,
    justifyContent: "center",
    marginTop: spacing.md,
  },
  editText: {
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.75,
  },
  description: {
    marginTop: spacing.md,
  },
});
