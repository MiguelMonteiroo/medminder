import { StyleSheet, View } from "react-native";
import { Pause, Play, Trash2 } from "lucide-react-native";
import { AppButton } from "./ui/AppButton";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = {
  paused: boolean;
  onTogglePause: () => void;
  onDelete: () => void;
};

export function CareBottomActionBar({ paused, onTogglePause, onDelete }: Props) {
  const PauseIcon = paused ? Play : Pause;

  return (
    <View style={styles.row}>
      <AppButton
        title={paused ? "Reativar" : "Pausar"}
        variant="ghost"
        onPress={onTogglePause}
        style={styles.action}
        accessibilityLabel={paused ? "Reativar medicamento" : "Pausar medicamento"}
      />
      <PauseIcon color={colors.info} size={20} style={styles.pauseIcon} />
      <AppButton
        title="Remover"
        variant="dangerSoft"
        onPress={onDelete}
        style={styles.action}
        accessibilityLabel="Remover medicamento"
      />
      <Trash2 color={colors.danger} size={20} style={styles.deleteIcon} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  action: {
    flex: 1,
  },
  pauseIcon: {
    left: spacing.lg,
    position: "absolute",
    top: 14,
  },
  deleteIcon: {
    position: "absolute",
    right: spacing.xl + spacing.lg,
    top: 14,
  },
});
