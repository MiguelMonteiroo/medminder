import { StyleSheet, View } from "react-native";
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
};

export function CareDetailHeroCard({ name, dosage, description, paused }: Props) {
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
        <AppText muted style={styles.description}>
          {description || "Acompanhe este medicamento com lembretes e histórico."}
        </AppText>
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
    gap: spacing.sm,
  },
  name: {
    color: colors.primaryDark,
  },
  dosage: {
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  description: {
    marginTop: spacing.md,
  },
});
