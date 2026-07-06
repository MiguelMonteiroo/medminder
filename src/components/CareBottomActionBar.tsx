import { StyleSheet, View } from "react-native";
import { Pause, Play, Trash2 } from "lucide-react-native";
import { AppButton } from "./ui/AppButton";
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
        icon={PauseIcon}
        onPress={onTogglePause}
        style={styles.action}
        accessibilityLabel={paused ? "Reativar medicamento" : "Pausar medicamento"}
      />
      <AppButton
        title="Remover"
        variant="dangerSoft"
        icon={Trash2}
        onPress={onDelete}
        style={styles.action}
        accessibilityLabel="Remover medicamento"
      />
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
});
