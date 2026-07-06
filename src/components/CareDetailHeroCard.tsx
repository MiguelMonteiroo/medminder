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
          <AppText variant="heading" style={styles.name}>
            {name}
          </AppText>
          <StatusBadge status={paused ? "paused" : "active"} />
        </View>
        <AppText style={styles.dosage}>{dosage}</AppText>
        {onEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar medicamento"
            onPress={onEdit}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          >
            <AppText variant="small" style={styles.editText}>
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
    borderColor: "#C7DDCF",
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: spacing.md,
    padding: spacing.xl,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 86,
    justifyContent: "center",
    marginRight: spacing.lg,
    width: 86,
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
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  editButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
  },
  editText: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.75,
  },
  description: {
    marginTop: spacing.md,
  },
});
