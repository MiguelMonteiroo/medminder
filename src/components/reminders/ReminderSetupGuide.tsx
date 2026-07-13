import { useEffect, useState } from "react";
import { AppState, Modal, Pressable, StyleSheet, View } from "react-native";
import { AlarmClockCheck, BellRing, Maximize2, X } from "lucide-react-native";
import { useAppData } from "../../services/appDataProvider";
import {
  getReminderPermissionState,
  openExactAlarmSettings,
  openFullScreenAlarmSettings,
  requestNotificationPermission,
} from "../../services/notificationPermissionService";
import { AppButton } from "../ui/AppButton";
import { AppText } from "../ui/AppText";
import { colors } from "../../theme/colors";
import { radii } from "../../theme/radii";
import { spacing } from "../../theme/spacing";

const STEPS = [
  {
    title: "Receber lembretes",
    description: "Permita que o MedMinder mostre avisos no aparelho.",
    icon: BellRing,
  },
  {
    title: "Avisar no horário exato",
    description: "Evite que o Android atrase seus lembretes.",
    icon: AlarmClockCheck,
  },
  {
    title: "Alarme em tela cheia",
    description: "Escolha se o alarme pode ocupar a tela no horário da dose.",
    icon: Maximize2,
  },
];

export function ReminderSetupGuide() {
  const {
    medications,
    settings,
    updateNotificationsEnabled,
    updateReminderSettings,
  } = useAppData();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [awaitingSettings, setAwaitingSettings] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");
  const visible = medications.length > 0 && !settings.reminderSetupCompleted;
  const current = STEPS[step];
  const Icon = current.icon;

  async function finish() {
    await updateReminderSettings({ reminderSetupCompleted: true });
  }

  useEffect(() => {
    if (!awaitingSettings) return;

    const subscription = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;

      const permissions = await getReminderPermissionState();
      if (
        step === 1 &&
        (permissions.exactAlarms === "granted" ||
          permissions.exactAlarms === "notRequired")
      ) {
        setAwaitingSettings(false);
        setPermissionMessage("");
        setStep(2);
      } else if (
        step === 2 &&
        (permissions.fullScreen === "granted" ||
          permissions.fullScreen === "unsupported")
      ) {
        setAwaitingSettings(false);
        setPermissionMessage("");
        await finish();
      } else {
        setAwaitingSettings(false);
        setPermissionMessage(
          "A autorização ainda não foi ativada. Você pode tentar novamente ou continuar sem ela."
        );
      }
    });

    return () => subscription.remove();
  }, [awaitingSettings, step]);

  async function activate() {
    setBusy(true);
    try {
      if (step === 0) {
        const result = await requestNotificationPermission();
        await updateNotificationsEnabled(result.granted);
        if (result.granted) {
          setPermissionMessage("");
          setStep(1);
        } else {
          setPermissionMessage(
            "As notificações continuam desativadas. Autorize para receber os lembretes."
          );
        }
      } else if (step === 1) {
        const permissions = await getReminderPermissionState();
        if (
          permissions.exactAlarms === "granted" ||
          permissions.exactAlarms === "notRequired"
        ) {
          setPermissionMessage("");
          setStep(2);
        } else {
          setAwaitingSettings(true);
          setPermissionMessage(
            "Na próxima tela, permita que o MedMinder defina alarmes e lembretes."
          );
          await openExactAlarmSettings();
        }
      } else {
        await updateReminderSettings({ fullScreenAlarmEnabled: true });
        const permissions = await getReminderPermissionState();
        if (permissions.fullScreen === "denied") {
          setAwaitingSettings(true);
          setPermissionMessage(
            "Na próxima tela, permita que o MedMinder abra alarmes em tela cheia."
          );
          await openFullScreenAlarmSettings();
        } else {
          setPermissionMessage("");
          await finish();
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Pressable
            accessibilityLabel="Fechar preparação dos lembretes"
            accessibilityRole="button"
            hitSlop={12}
            onPress={finish}
            style={styles.close}
          >
            <X color={colors.textMuted} size={24} />
          </Pressable>
          <View style={styles.iconWrap}>
            <Icon color={colors.primaryDark} size={30} />
          </View>
          <AppText variant="caption" muted>
            Etapa {step + 1} de {STEPS.length}
          </AppText>
          <AppText variant="title" style={styles.title}>
            {step === 0 ? "Prepare seus lembretes" : current.title}
          </AppText>
          <AppText muted style={styles.description}>
            {current.description}
          </AppText>
          {permissionMessage ? (
            <AppText variant="small" style={styles.permissionMessage}>
              {permissionMessage}
            </AppText>
          ) : null}
          <AppButton
            accessibilityLabel={`Ativar ${current.title.toLowerCase()}`}
            disabled={busy}
            onPress={activate}
            style={styles.action}
            title={
              step === 0
                ? "Permitir e continuar"
                : step === 1
                  ? "Abrir configurações"
                  : "Permitir tela cheia"
            }
          />
          <AppButton
            accessibilityLabel="Fazer esta configuração depois"
            onPress={step === STEPS.length - 1 ? finish : () => setStep((value) => value + 1)}
            title="Agora não"
            variant="ghost"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(36, 31, 26, 0.35)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  close: { alignSelf: "flex-end", minHeight: 44, minWidth: 44, padding: spacing.sm },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 56,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: 56,
  },
  title: { color: colors.primaryDark, marginTop: spacing.xs },
  description: { marginTop: spacing.sm },
  permissionMessage: {
    color: colors.primaryDark,
    marginTop: spacing.md,
  },
  action: { marginBottom: spacing.sm, marginTop: spacing.xl },
});
