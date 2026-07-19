import { StyleSheet, View } from "react-native";
import { Heart, Pill, Plus } from "lucide-react-native";
import { EmptyState } from "./ui/EmptyState";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = { title: string; message: string; actionLabel: string; onAction: () => void };

export function MedicationEmptyState(props: Props) {
  return (
    <EmptyState
      {...props}
      actionIcon={Plus}
      icon={Pill}
      illustration={<CareIllustration />}
    />
  );
}

function CareIllustration() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={styles.art}>
      <View style={styles.pillDisc}>
        <Pill color={colors.primaryDark} size={62} strokeWidth={1.8} />
      </View>
      <View style={styles.heartDisc}>
        <Heart color={colors.surface} fill={colors.surface} size={24} strokeWidth={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  art: { height: 132, marginBottom: spacing.lg, width: 156 },
  pillDisc: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    height: 112,
    justifyContent: "center",
    left: 12,
    position: "absolute",
    top: 0,
    transform: [{ rotate: "-14deg" }],
    width: 112,
  },
  heartDisc: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderColor: colors.surface,
    borderRadius: 8,
    borderWidth: 3,
    bottom: 0,
    height: 52,
    justifyContent: "center",
    position: "absolute",
    right: 4,
    width: 52,
  },
});
