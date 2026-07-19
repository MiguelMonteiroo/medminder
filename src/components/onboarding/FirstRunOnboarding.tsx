import { useEffect, useState } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  AlarmClockCheck,
  BatteryCharging,
  BellRing,
  CheckCircle2,
  Clock3,
  HeartPulse,
  History,
  LockKeyhole,
  Maximize2,
  Pill,
  Volume2,
} from "lucide-react-native";
import { useAppData } from "../../services/appDataProvider";
import {
  ensureAlarmChannels,
  getReminderPermissionState,
  openBatterySettings,
  openCriticalAlarmChannelSettings,
  openDoNotDisturbSettings,
  openExactAlarmSettings,
  openFullScreenAlarmSettings,
  openNotificationSettings,
  requestNotificationPermission,
} from "../../services/notificationPermissionService";
import {
  getNotificationOnboardingAction,
  ONBOARDING_PERMISSION_STEPS,
  type OnboardingPermissionStep,
} from "../../services/reminders/permissionOnboarding";
import { validateProfileName } from "../../utils/validation";
import { AppButton } from "../ui/AppButton";
import { AppText } from "../ui/AppText";
import { Screen } from "../ui/Screen";
import { ConfirmationDialog } from "../ui/ConfirmationDialog";
import { colors } from "../../theme/colors";
import { radii } from "../../theme/radii";
import { spacing } from "../../theme/spacing";
import { fontFamilies } from "../../theme/typography";

type Step =
  | "welcome"
  | "profile"
  | "guide"
  | OnboardingPermissionStep;

type AwaitingCapability =
  | "notifications"
  | "doNotDisturb"
  | "exact"
  | "fullScreen"
  | "battery"
  | null;

export function FirstRunOnboarding() {
  const {
    completeOnboarding,
    updateNotificationsEnabled,
    updateReminderSettings,
  } = useAppData();
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [permissionMessage, setPermissionMessage] = useState("");
  const [notificationRequestAttempted, setNotificationRequestAttempted] =
    useState(false);
  const [confirmSkipVisible, setConfirmSkipVisible] = useState(false);
  const [awaitingCapability, setAwaitingCapability] =
    useState<AwaitingCapability>(null);
  const [busy, setBusy] = useState(false);

  async function finishOnboarding() {
    setBusy(true);
    try {
      await completeOnboarding(name);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!awaitingCapability) return;

    const subscription = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;

      const permissions = await getReminderPermissionState();
      setAwaitingCapability(null);

      if (awaitingCapability === "notifications") {
        const granted = permissions.notifications === "granted";
        await updateNotificationsEnabled(granted);
        if (granted) {
          setPermissionMessage("");
          setStep("lockScreenDetails");
        } else {
          setPermissionMessage(
            "As notificações continuam desativadas. Ative a opção do Remedin nas configurações ou continue sem lembretes."
          );
        }
        return;
      }

      if (awaitingCapability === "doNotDisturb") {
        if (
          permissions.doNotDisturb === "granted" &&
          permissions.criticalAlarmChannel === "bypasses"
        ) {
          await ensureAlarmChannels();
          await updateReminderSettings({ criticalAlertsEnabled: true });
          setPermissionMessage("");
          setStep("exact");
        } else {
          setPermissionMessage(
            "O Android ainda não autorizou alarmes no silencioso e Não Perturbe. Você pode tentar novamente ou continuar com alarmes comuns."
          );
        }
        return;
      }

      if (awaitingCapability === "exact") {
        if (
          permissions.exactAlarms === "granted" ||
          permissions.exactAlarms === "notRequired"
        ) {
          setPermissionMessage("");
          setStep("fullScreen");
        } else {
          setPermissionMessage(
            "O horário exato ainda não foi autorizado. Você pode tentar novamente ou continuar sem ele."
          );
        }
        return;
      }

      if (awaitingCapability === "battery") {
        if (permissions.batteryOptimization === "unrestricted") {
          setPermissionMessage("");
          await finishOnboarding();
        } else {
          setPermissionMessage(
            "A economia de bateria ainda está ativa para o Remedin. Revise novamente ou continue; alguns aparelhos podem atrasar alarmes."
          );
        }
        return;
      }

      if (awaitingCapability !== "fullScreen") return;

      if (
        permissions.fullScreen === "granted" ||
        permissions.fullScreen === "unsupported"
      ) {
        setPermissionMessage("");
        setStep("battery");
      } else {
        setPermissionMessage(
          "A tela cheia ainda não foi autorizada. Você pode tentar novamente ou continuar sem ela."
        );
      }
    });

    return () => subscription.remove();
  }, [awaitingCapability, name]);

  function continueFromProfile() {
    const error = validateProfileName(name);
    if (error) {
      setNameError(error);
      return;
    }
    setNameError("");
    setStep("guide");
  }

  async function requestBasicNotifications() {
    setBusy(true);
    setPermissionMessage("");
    try {
      const permissions = await getReminderPermissionState();
      const action = getNotificationOnboardingAction(
        permissions.notifications,
        notificationRequestAttempted
      );

      if (action === "continue") {
        await updateNotificationsEnabled(true);
        setStep("lockScreenDetails");
        return;
      }

      if (action === "settings") {
        setAwaitingCapability("notifications");
        setPermissionMessage(
          "Na próxima tela, ative Permitir notificações para o Remedin. Depois, volte ao aplicativo."
        );
        await openNotificationSettings();
        return;
      }

      setNotificationRequestAttempted(true);
      const result = await requestNotificationPermission();
      await updateNotificationsEnabled(result.granted);
      if (result.granted) {
        setStep("lockScreenDetails");
      } else {
        setPermissionMessage(
          "As notificações não foram autorizadas. Tente novamente ou continue sem lembretes."
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function requestDoNotDisturbAccess() {
    setBusy(true);
    setPermissionMessage("");
    try {
      const permissions = await getReminderPermissionState();
      if (
        permissions.doNotDisturb === "granted" &&
        permissions.criticalAlarmChannel === "bypasses"
      ) {
        await ensureAlarmChannels();
        await updateReminderSettings({ criticalAlertsEnabled: true });
        setStep("exact");
        return;
      }

      if (permissions.doNotDisturb === "granted") {
        setAwaitingCapability("doNotDisturb");
        setPermissionMessage(
          "Na próxima tela, permita que o canal Alarmes críticos de dose ignore o Não Perturbe."
        );
        await openCriticalAlarmChannelSettings();
        return;
      }

      await updateReminderSettings({ criticalAlertsEnabled: true });
      setAwaitingCapability("doNotDisturb");
      setPermissionMessage(
        "Na próxima tela, localize o Remedin e ative o acesso. O app não altera o modo do aparelho."
      );
      await openDoNotDisturbSettings();
    } finally {
      setBusy(false);
    }
  }

  async function requestExactAlarms() {
    setBusy(true);
    setPermissionMessage("");
    try {
      const permissions = await getReminderPermissionState();
      if (
        permissions.exactAlarms === "granted" ||
        permissions.exactAlarms === "notRequired"
      ) {
        setStep("fullScreen");
        return;
      }

      setAwaitingCapability("exact");
      setPermissionMessage(
        "Na próxima tela, permita que o Remedin defina alarmes e lembretes."
      );
      await openExactAlarmSettings();
    } finally {
      setBusy(false);
    }
  }

  async function requestFullScreenAlarm() {
    setBusy(true);
    setPermissionMessage("");
    try {
      await updateReminderSettings({ fullScreenAlarmEnabled: true });
      const permissions = await getReminderPermissionState();
      if (
        permissions.fullScreen === "granted" ||
        permissions.fullScreen === "unsupported"
      ) {
        setStep("battery");
        return;
      }

      setAwaitingCapability("fullScreen");
      setPermissionMessage(
        "Na próxima tela, permita que o Remedin abra alarmes em tela cheia."
      );
      await openFullScreenAlarmSettings();
    } finally {
      setBusy(false);
    }
  }

  async function skipBasicNotifications() {
    setConfirmSkipVisible(false);
    setBusy(true);
    try {
      await updateNotificationsEnabled(false);
      setPermissionMessage("");
      setStep("lockScreenDetails");
    } finally {
      setBusy(false);
    }
  }

  async function skipFullScreen() {
    setBusy(true);
    try {
      await updateReminderSettings({ fullScreenAlarmEnabled: false });
      setPermissionMessage("");
      setStep("battery");
    } finally {
      setBusy(false);
    }
  }

  async function skipDoNotDisturb() {
    setBusy(true);
    try {
      await updateReminderSettings({ criticalAlertsEnabled: false });
      setPermissionMessage("");
      setStep("exact");
    } finally {
      setBusy(false);
    }
  }

  async function chooseLockScreenDetails(enabled: boolean) {
    setBusy(true);
    try {
      await updateReminderSettings({ showLockScreenDetails: enabled });
      setPermissionMessage("");
      setStep("doNotDisturb");
    } finally {
      setBusy(false);
    }
  }

  async function requestBatteryAccess() {
    setBusy(true);
    setPermissionMessage("");
    try {
      const permissions = await getReminderPermissionState();
      if (permissions.batteryOptimization === "unrestricted") {
        await finishOnboarding();
        return;
      }

      setAwaitingCapability("battery");
      setPermissionMessage(
        "Na próxima tela, procure o Remedin e permita uso sem restrições. Depois, volte ao aplicativo."
      );
      await openBatterySettings();
    } finally {
      setBusy(false);
    }
  }

  function handlePrimaryAction() {
    if (busy) return;
    if (step === "welcome") setStep("profile");
    else if (step === "profile") continueFromProfile();
    else if (step === "guide") setStep("notifications");
    else if (step === "notifications") requestBasicNotifications();
    else if (step === "lockScreenDetails") chooseLockScreenDetails(true);
    else if (step === "doNotDisturb") requestDoNotDisturbAccess();
    else if (step === "exact") requestExactAlarms();
    else if (step === "fullScreen") requestFullScreenAlarm();
    else requestBatteryAccess();
  }

  const primaryTitle = getPrimaryTitle(step, busy);

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <OnboardingStepContent
            name={name}
            nameError={nameError}
            onNameChange={(value) => {
              setName(value);
              if (nameError) setNameError("");
            }}
            permissionMessage={permissionMessage}
            step={step}
          />
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            accessibilityLabel={primaryTitle}
            accessibilityState={{ busy, disabled: busy }}
            disabled={busy}
            onPress={handlePrimaryAction}
            title={primaryTitle}
          />
          {step === "notifications" ||
          step === "lockScreenDetails" ||
          step === "doNotDisturb" ||
          step === "exact" ||
          step === "fullScreen" ||
          step === "battery" ? (
            <Pressable
              accessibilityLabel={`Fazer ${getStepTitle(step).toLowerCase()} depois`}
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                if (step === "notifications") setConfirmSkipVisible(true);
                else if (step === "lockScreenDetails")
                  chooseLockScreenDetails(false);
                else if (step === "doNotDisturb") skipDoNotDisturb();
                else if (step === "exact") {
                  setPermissionMessage("");
                  setStep("fullScreen");
                } else if (step === "fullScreen") skipFullScreen();
                else finishOnboarding();
              }}
              style={styles.secondaryAction}
            >
              <AppText style={styles.secondaryText}>Agora não</AppText>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <ConfirmationDialog
        busy={busy}
        cancelLabel="Voltar e permitir"
        confirmAccessibilityLabel="Continuar sem lembretes"
        confirmLabel="Continuar sem lembretes"
        description="Sem essa permissão, o Remedin não poderá avisar quando uma dose estiver próxima ou no horário. Você ainda poderá usar o app e ativar os lembretes depois em Perfil."
        icon={BellRing}
        onCancel={() => setConfirmSkipVisible(false)}
        onConfirm={skipBasicNotifications}
        title="Continuar sem lembretes?"
        visible={confirmSkipVisible}
      />
    </Screen>
  );
}

function OnboardingStepContent({
  step,
  name,
  nameError,
  onNameChange,
  permissionMessage,
}: {
  step: Step;
  name: string;
  nameError: string;
  onNameChange: (value: string) => void;
  permissionMessage: string;
}) {
  if (step === "welcome") {
    return (
      <View style={styles.stepContent}>
        <View style={styles.brandRow}>
          <View style={styles.iconWrap}>
            <HeartPulse color={colors.primaryDark} size={30} />
          </View>
          <AppText variant="subheading" style={styles.brandName}>
            Remedin
          </AppText>
        </View>
        <AppText accessibilityRole="header" variant="title" style={styles.title}>
          Bem-vindo ao Remedin
        </AppText>
        <AppText muted style={styles.description}>
          Organize seus medicamentos e acompanhe sua rotina com mais tranquilidade.
        </AppText>
        <View style={styles.peachTip}>
          <HeartPulse color={colors.accent} size={22} />
          <AppText style={styles.tipText}>
            Um lembrete pessoal para apoiar seu cuidado diário.
          </AppText>
        </View>
        <View style={styles.localDataNote}>
          <LockKeyhole color={colors.primary} size={18} />
          <AppText variant="small" muted style={styles.localDataText}>
            Seus dados ficam somente neste aparelho.
          </AppText>
        </View>
      </View>
    );
  }

  if (step === "profile") {
    return (
      <View style={styles.stepContent}>
        <AppText variant="caption" style={styles.eyebrow}>
          Primeiro acesso
        </AppText>
        <AppText accessibilityRole="header" variant="title" style={styles.title}>
          Como podemos chamar você?
        </AppText>
        <AppText muted style={styles.description}>
          Usaremos seu nome apenas para personalizar sua experiência neste aparelho.
        </AppText>
        <AppText style={styles.inputLabel}>Seu nome</AppText>
        <TextInput
          accessibilityLabel="Seu nome"
          autoCapitalize="words"
          autoComplete="name"
          autoFocus
          onChangeText={onNameChange}
          placeholder="Digite seu nome"
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          style={[styles.input, nameError ? styles.inputError : null]}
          value={name}
        />
        {nameError ? (
          <AppText
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
            style={styles.errorText}
            variant="small"
          >
            {nameError}
          </AppText>
        ) : null}
        <View style={styles.localDataNote}>
          <LockKeyhole color={colors.primary} size={18} />
          <AppText variant="small" muted style={styles.localDataText}>
            Seu nome fica somente neste aparelho.
          </AppText>
        </View>
      </View>
    );
  }

  if (step === "guide") {
    return (
      <View style={styles.stepContent}>
        <AppText variant="caption" style={styles.eyebrow}>
          Conheça o Remedin
        </AppText>
        <AppText accessibilityRole="header" variant="title" style={styles.title}>
          Seu cuidado em um só lugar
        </AppText>
        <View style={styles.featureList}>
          <FeatureRow
            icon={Pill}
            title="Organize sua rotina"
            description="Cadastre medicamentos e horários."
          />
          <FeatureRow
            icon={CheckCircle2}
            title="Cuide das doses de hoje"
            description="Marque como tomada, adie ou pule."
          />
          <FeatureRow
            icon={History}
            title="Acompanhe seu histórico"
            description="Consulte seus registros dos últimos dias."
            last
          />
        </View>
      </View>
    );
  }

  const content = PERMISSION_CONTENT[step];
  const Icon = content.icon;

  return (
    <View style={styles.stepContent}>
      <AppText variant="caption" style={styles.stepIndicator}>
        Etapa {ONBOARDING_PERMISSION_STEPS.indexOf(step) + 1} de{" "}
        {ONBOARDING_PERMISSION_STEPS.length}
      </AppText>
      <View style={styles.iconWrap}>
        <Icon color={colors.primaryDark} size={30} />
      </View>
      <AppText accessibilityRole="header" variant="title" style={styles.title}>
        {content.title}
      </AppText>
      <AppText muted style={styles.description}>
        {content.description}
      </AppText>
      {step === "notifications" ? (
        <View style={styles.peachTip}>
          <BellRing color={colors.accent} size={22} />
          <AppText style={styles.tipText}>
            Você pode mudar isso depois em Perfil.
          </AppText>
        </View>
      ) : null}
      {step === "exact" ? (
        <View style={styles.benefitList}>
          <BenefitRow text="Lembrete 5 minutos antes" />
          <BenefitRow text="Alarme no horário da dose" />
        </View>
      ) : null}
      {step === "fullScreen" ? <AlarmPreview /> : null}
      {step === "battery" ? (
        <View style={styles.peachTip}>
          <BatteryCharging color={colors.accent} size={22} />
          <AppText style={styles.tipText}>
            Essa configuração varia entre fabricantes. O Remedin não altera outras opções de bateria.
          </AppText>
        </View>
      ) : null}
      {permissionMessage ? (
        <AppText
          accessibilityLiveRegion="polite"
          style={styles.permissionMessage}
          variant="small"
        >
          {permissionMessage}
        </AppText>
      ) : null}
    </View>
  );
}

const PERMISSION_CONTENT = {
  notifications: {
    title: "Receba seus lembretes",
    description:
      "O Remedin precisa enviar notificações para avisar quando estiver perto da hora e no horário da dose.",
    icon: BellRing,
  },
  lockScreenDetails: {
    title: "Detalhes na tela bloqueada",
    description:
      "Escolha se o nome, a dosagem e as notas do medicamento podem aparecer antes de desbloquear o aparelho. Desative para mostrar apenas um aviso privado.",
    icon: LockKeyhole,
  },
  doNotDisturb: {
    title: "Alarmes prioritários",
    description:
      "Opcional: autorize alarmes importantes para tocar no silencioso e no Não Perturbe em modo Prioridade ou Alarmes. O modo Silêncio total bloqueia todos os apps.",
    icon: Volume2,
  },
  exact: {
    title: "Avise no horário certo",
    description:
      "Permita alarmes exatos para evitar atrasos causados pelo Android.",
    icon: AlarmClockCheck,
  },
  fullScreen: {
    title: "Alarme em tela cheia",
    description:
      "Quando permitido pelo Android, o alarme pode ocupar a tela para chamar sua atenção.",
    icon: Maximize2,
  },
  battery: {
    title: "Permita funcionar em segundo plano",
    description:
      "Alguns aparelhos limitam aplicativos quando a tela está bloqueada. Revise a bateria para reduzir atrasos nos alarmes.",
    icon: BatteryCharging,
  },
} as const;

function FeatureRow({
  icon: Icon,
  title,
  description,
  last = false,
}: {
  icon: typeof Pill;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.featureRow, last && styles.featureRowLast]}>
      <View style={styles.featureIcon}>
        <Icon color={colors.primaryDark} size={23} />
      </View>
      <View style={styles.featureText}>
        <AppText variant="subheading">{title}</AppText>
        <AppText muted variant="small" style={styles.featureDescription}>
          {description}
        </AppText>
      </View>
    </View>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <View style={styles.benefitRow}>
      <CheckCircle2 color={colors.success} size={22} />
      <AppText style={styles.benefitText}>{text}</AppText>
    </View>
  );
}

function AlarmPreview() {
  return (
    <View
      accessible
      accessibilityLabel="Exemplo de alarme para Losartana 50 miligramas"
      style={styles.alarmPreview}
    >
      <View style={styles.alarmPreviewHeader}>
        <Clock3 color={colors.primaryDark} size={23} />
        <View style={styles.alarmPreviewText}>
          <AppText variant="subheading">Losartana 50 mg</AppText>
          <AppText variant="caption" muted>
            09:00
          </AppText>
        </View>
      </View>
      <View style={styles.previewActions}>
        <View style={styles.previewPrimary}>
          <AppText variant="caption" style={styles.previewPrimaryText}>
            Marcar como tomado
          </AppText>
        </View>
        <View style={styles.previewSecondary}>
          <AppText variant="caption" style={styles.previewSecondaryText}>
            Adiar 5 min
          </AppText>
        </View>
      </View>
    </View>
  );
}

function getPrimaryTitle(step: Step, busy: boolean): string {
  if (busy) return "Aguarde...";
  if (step === "welcome") return "Começar";
  if (step === "profile") return "Continuar";
  if (step === "guide") return "Configurar lembretes";
  if (step === "notifications") return "Permitir notificações";
  if (step === "lockScreenDetails") return "Mostrar detalhes";
  if (step === "doNotDisturb") return "Revisar no Android";
  if (step === "exact") return "Abrir configurações";
  if (step === "fullScreen") return "Permitir tela cheia";
  return "Revisar economia de bateria";
}

function getStepTitle(
  step: OnboardingPermissionStep
): string {
  return PERMISSION_CONTENT[step].title;
}

const styles = StyleSheet.create({
  keyboardArea: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: spacing.lg },
  stepContent: { flex: 1, paddingTop: spacing.xl },
  brandRow: { alignItems: "center", flexDirection: "row", marginBottom: spacing.xl },
  brandName: { color: colors.primaryDark, marginLeft: spacing.md },
  eyebrow: { color: colors.primaryDark, marginBottom: spacing.md },
  stepIndicator: {
    alignSelf: "flex-start",
    borderColor: colors.primary,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.primaryDark,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 64,
    justifyContent: "center",
    marginBottom: spacing.xl,
    width: 64,
  },
  title: { color: colors.primaryDark },
  description: { marginTop: spacing.md },
  peachTip: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSelectionBorder,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  tipText: { flex: 1, marginLeft: spacing.md },
  localDataNote: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.xl,
  },
  localDataText: { flex: 1, marginLeft: spacing.sm },
  inputLabel: { marginBottom: spacing.sm, marginTop: spacing.xxl },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.controlBorder,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fontFamilies.regular,
    fontSize: 18,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, marginTop: spacing.sm },
  featureList: { marginTop: spacing.xl },
  featureRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingVertical: spacing.lg,
  },
  featureRowLast: { borderBottomWidth: 0 },
  featureIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 48,
  },
  featureText: { flex: 1 },
  featureDescription: { marginTop: spacing.xs },
  benefitList: { marginTop: spacing.xl },
  benefitRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 58,
  },
  benefitText: { flex: 1, marginLeft: spacing.md },
  permissionMessage: { color: colors.primaryDark, marginTop: spacing.lg },
  alarmPreview: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  alarmPreviewHeader: { alignItems: "center", flexDirection: "row" },
  alarmPreviewText: { flex: 1, marginLeft: spacing.md },
  previewActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  previewPrimary: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.md,
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  previewPrimaryText: { color: colors.white, textAlign: "center" },
  previewSecondary: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  previewSecondaryText: { color: colors.primaryDark, textAlign: "center" },
  footer: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
  },
  secondaryAction: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 48,
  },
  secondaryText: { color: colors.primaryDark },
  modalOverlay: {
    backgroundColor: "rgba(36, 31, 26, 0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  confirmation: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  confirmationIcon: {
    alignItems: "center",
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
    height: 56,
    justifyContent: "center",
    marginBottom: spacing.lg,
    width: 56,
  },
  confirmationTitle: { color: colors.primaryDark },
  confirmationDescription: { marginTop: spacing.md },
  confirmationPrimary: { marginBottom: spacing.sm, marginTop: spacing.xl },
});
