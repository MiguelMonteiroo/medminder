import { useRef } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Modal,
  StyleSheet,
  View,
} from "react-native";
import { AlertTriangle, type LucideIcon } from "lucide-react-native";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { colors } from "../../theme/colors";
import { radii } from "../../theme/radii";
import { spacing } from "../../theme/spacing";

type Props = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  cancelLabel?: string;
  confirmAccessibilityLabel?: string;
  icon?: LucideIcon;
  variant?: "normal" | "destructive";
  busy?: boolean;
};

export function ConfirmationDialog({
  visible,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  cancelLabel = "Cancelar",
  confirmAccessibilityLabel = confirmLabel,
  icon: Icon = AlertTriangle,
  variant = "normal",
  busy = false,
}: Props) {
  const titleRef = useRef<View>(null);
  const destructive = variant === "destructive";

  function focusTitle() {
    const node = findNodeHandle(titleRef.current);
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
  }

  return (
    <Modal
      animationType="fade"
      onShow={focusTitle}
      onRequestClose={busy ? () => undefined : onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View accessibilityViewIsModal style={styles.overlay}>
        <View style={styles.dialog}>
          <View
            style={[
              styles.iconContainer,
              destructive && styles.destructiveIconContainer,
            ]}
          >
            <Icon
              color={destructive ? colors.danger : colors.primaryDark}
              size={28}
            />
          </View>
          <View
            accessibilityLabel={title}
            accessibilityRole="header"
            accessible
            ref={titleRef}
          >
            <AppText variant="heading" style={styles.title}>
              {title}
            </AppText>
          </View>
          <AppText muted style={styles.description}>
            {description}
          </AppText>
          <View style={styles.actions}>
            <AppButton
              accessibilityLabel={confirmAccessibilityLabel}
              accessibilityState={{ busy, disabled: busy }}
              disabled={busy}
              onPress={onConfirm}
              title={busy ? "Aguarde..." : confirmLabel}
              variant={destructive ? "danger" : "primary"}
            />
            <AppButton
              accessibilityLabel={cancelLabel}
              disabled={busy}
              onPress={onCancel}
              title={cancelLabel}
              variant="ghost"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(37, 32, 24, 0.48)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    maxWidth: 420,
    padding: spacing.xl,
    width: "100%",
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  destructiveIconContainer: { backgroundColor: colors.dangerSoft },
  title: { color: colors.primaryDark, marginTop: spacing.lg },
  description: { marginTop: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.xl },
});
