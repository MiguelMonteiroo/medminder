import { Pressable, StyleSheet, View } from "react-native";
import { Clock3 } from "lucide-react-native";
import { AppText } from "./ui/AppText";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = {
  time: string;
  name?: string;
  dosage?: string;
  onPress?: () => void;
};

export function CareNextDoseCard({ time, name, dosage, onPress }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Clock3 color={colors.accent} size={18} />
        <AppText style={styles.headingText}>Próxima dose</AppText>
      </View>
      <View style={styles.content}>
        <AppText variant="heading" style={styles.time}>
          {time}
        </AppText>
        <View style={styles.info}>
          <AppText style={styles.name}>{name || "Nenhuma dose pendente"}</AppText>
          <AppText variant="small" muted>
            {dosage || "Sua rotina está tranquila agora"}
          </AppText>
        </View>
        {onPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver detalhes da próxima dose"
            onPress={onPress}
            style={({ pressed }) => [styles.details, pressed && styles.pressed]}
          >
            <AppText variant="caption" style={styles.detailsText}>
              Ver detalhes
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.accentSoft,
    borderColor: "#EEC3A7",
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headingText: {
    color: colors.accent,
    fontWeight: "800",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
  },
  time: {
    color: colors.accent,
    marginRight: spacing.lg,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: "800",
  },
  details: {
    backgroundColor: colors.surface,
    borderColor: "#E9B48F",
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  detailsText: {
    color: colors.accent,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.8,
  },
});
