import {
  AppState,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import {
  AlarmClockCheck,
  BatteryCharging,
  Bell,
  Info,
  LockKeyhole,
  Maximize2,
  Settings,
  TestTube2,
  UserRound,
  Volume2,
} from "lucide-react-native";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { AppText } from "../components/ui/AppText";
import { Screen } from "../components/ui/Screen";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { CareInfoTip } from "../components/CareInfoTip";
import { useAppData } from "../services/appDataProvider";
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
} from "../services/notificationPermissionService";
import type { ReminderPermissionState } from "../types/domain";
import { validateProfileName } from "../utils/validation";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

export function SettingsScreen() {
  const {
    settings,
    updateUserName,
    updateNotificationsEnabled,
    updateReminderSettings,
    runAlarmTest,
    reminderSyncPending,
  } = useAppData();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionState, setPermissionState] =
    useState<ReminderPermissionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(settings.userName);
  const [nameError, setNameError] = useState("");
  const [alarmTestMessage, setAlarmTestMessage] = useState("");

  const refreshPermissions = useCallback(
    async (enabledPreference = settings.notificationsEnabled) => {
      const readiness = await getReminderPermissionState();
      setPermissionState(readiness);
      setNotificationsEnabled(
        enabledPreference && readiness.notifications === "granted"
      );
      setLoading(false);
      return readiness;
    },
    [settings.notificationsEnabled]
  );

  useEffect(() => {
    setNameDraft(settings.userName);
  }, [settings.userName]);

  useEffect(() => {
    if (!alarmTestMessage) return;
    const timer = setTimeout(() => setAlarmTestMessage(""), 8_000);
    return () => clearTimeout(timer);
  }, [alarmTestMessage]);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshPermissions();
    });
    return () => subscription.remove();
  }, [refreshPermissions]);

  const basicPermissionGranted =
    permissionState?.notifications === "granted";
  const remindersReady = notificationsEnabled && basicPermissionGranted;
  const advancedDisabled = !remindersReady;

  async function handleToggleNotifications(value: boolean) {
    setLoading(true);
    if (value) {
      const result = await requestNotificationPermission();
      await updateNotificationsEnabled(result.granted);
      await refreshPermissions(result.granted);
      return;
    }

    await updateNotificationsEnabled(false);
    await refreshPermissions(false);
  }

  async function handleExactAlarm() {
    if (advancedDisabled) return;
    await openExactAlarmSettings();
  }

  async function handleCriticalAlertsToggle(value: boolean) {
    if (advancedDisabled) return;
    if (!value) {
      await updateReminderSettings({ criticalAlertsEnabled: false });
      return;
    }

    const readiness = await refreshPermissions();
    if (readiness.doNotDisturb === "granted") {
      await ensureAlarmChannels();
      const channelReadiness = await refreshPermissions();
      if (channelReadiness.criticalAlarmChannel === "bypasses") {
        await updateReminderSettings({ criticalAlertsEnabled: true });
      } else {
        await updateReminderSettings({ criticalAlertsEnabled: true });
        await openCriticalAlarmChannelSettings();
      }
      return;
    }

    await updateReminderSettings({ criticalAlertsEnabled: true });
    await openDoNotDisturbSettings();
  }

  async function handleFullScreenToggle(value: boolean) {
    if (advancedDisabled) return;
    await updateReminderSettings({ fullScreenAlarmEnabled: value });
    if (value && permissionState?.fullScreen === "denied") {
      await openFullScreenAlarmSettings();
    }
  }

  async function handleSaveName() {
    const error = validateProfileName(nameDraft);
    if (error) {
      setNameError(error);
      return;
    }

    await updateUserName(nameDraft);
    setNameError("");
    setEditingName(false);
  }

  function handleCancelName() {
    setNameDraft(settings.userName);
    setNameError("");
    setEditingName(false);
  }

  async function handleAlarmTest() {
    if (advancedDisabled) return;
    setAlarmTestMessage("");
    const readiness = await refreshPermissions();
    if (readiness.notifications !== "granted") return;

    await runAlarmTest();
    setAlarmTestMessage(
      "Teste agendado. Bloqueie a tela agora; o alarme aparecerá em cinco segundos."
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="caption" muted>
          Perfil
        </AppText>
        <AppText variant="title" style={styles.title}>
          Seu cuidado
        </AppText>

        {reminderSyncPending ? (
          <CareInfoTip text="Alguns lembretes aguardam sincronização. O MedMinder tentará novamente ao abrir o app." />
        ) : null}

        <ProfileNameCard
          editing={editingName}
          error={nameError}
          name={settings.userName}
          nameDraft={nameDraft}
          onCancel={handleCancelName}
          onChange={(value) => {
            setNameDraft(value);
            if (nameError) setNameError("");
          }}
          onEdit={() => setEditingName(true)}
          onSave={handleSaveName}
        />

        <SectionHeader title="Lembretes" meta="Configure na ordem" />

        <AppCard style={styles.card}>
          <SettingHeader
            icon={Bell}
            title="Permitir notificações"
            hint="É a permissão básica para receber qualquer lembrete."
            status={remindersReady ? "active" : "paused"}
          />

          {permissionState?.notifications === "denied" ? (
            <View style={styles.permissionBody}>
              <AppText style={styles.warningTitle}>Permissão bloqueada</AppText>
              <AppText variant="small" muted style={styles.bodyText}>
                Abra as configurações do aparelho e permita notificações para o MedMinder.
              </AppText>
              <AppButton
                accessibilityLabel="Abrir configurações de notificação"
                icon={Settings}
                onPress={openNotificationSettings}
                title="Abrir configurações"
                variant="ghost"
              />
            </View>
          ) : (
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <AppText style={styles.settingLabel}>Lembretes</AppText>
                <AppText variant="small" muted style={styles.hintText}>
                  {remindersReady
                    ? "Notificações ativadas para sua rotina."
                    : "Ative para receber avisos dos medicamentos."}
                </AppText>
              </View>
              <Switch
                accessibilityLabel="Ativar notificações"
                accessibilityState={{ checked: remindersReady, disabled: loading }}
                disabled={loading}
                onValueChange={handleToggleNotifications}
                thumbColor={remindersReady ? colors.primary : colors.surface}
                trackColor={{ false: colors.surfaceMuted, true: colors.primarySoft }}
                value={remindersReady}
              />
            </View>
          )}
        </AppCard>

        <AppCard style={styles.card}>
          <SettingHeader
            icon={Volume2}
            title="Alarmes prioritários"
            hint="Toca no silencioso e nos modos de Não Perturbe que permitem alarmes."
            status={
              !advancedDisabled &&
              settings.criticalAlertsEnabled &&
              permissionState?.doNotDisturb === "granted" &&
              permissionState?.criticalAlarmChannel === "bypasses"
                ? "active"
                : "paused"
            }
          />
          {advancedDisabled ? (
            <DisabledRequirement />
          ) : (
            <>
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <AppText style={styles.settingLabel}>Alarmes importantes</AppText>
                  <AppText variant="small" muted style={styles.hintText}>
                    {permissionState?.doNotDisturb === "granted" &&
                    permissionState?.criticalAlarmChannel === "bypasses"
                      ? "Ativo no silencioso e no Não Perturbe em modo Prioridade ou Alarmes. Silêncio total bloqueia todos os apps."
                      : "Sem esta autorização, o Android ainda pode silenciar o alarme."}
                  </AppText>
                </View>
                <Switch
                  accessibilityLabel="Tocar alarmes no silencioso e Não Perturbe"
                  accessibilityState={{
                    checked: settings.criticalAlertsEnabled,
                  }}
                  onValueChange={handleCriticalAlertsToggle}
                  value={settings.criticalAlertsEnabled}
                />
              </View>
              {settings.criticalAlertsEnabled &&
              (permissionState?.doNotDisturb === "denied" ||
                permissionState?.criticalAlarmChannel === "blocked") ? (
                <AppButton
                  accessibilityHint="Abre a autorização de alarmes importantes do Android"
                  accessibilityLabel="Autorizar alarmes no Não Perturbe"
                  icon={Settings}
                  onPress={
                    permissionState?.doNotDisturb === "granted"
                      ? openCriticalAlarmChannelSettings
                      : openDoNotDisturbSettings
                  }
                  style={styles.inlineAction}
                  title="Autorizar no Android"
                  variant="ghost"
                />
              ) : null}
            </>
          )}
        </AppCard>

        <AppCard style={styles.card}>
          <SettingHeader
            icon={AlarmClockCheck}
            title="Avisar no horário exato"
            hint="Evita que o Android atrase os lembretes."
            status={
              !advancedDisabled &&
              (permissionState?.exactAlarms === "granted" ||
                permissionState?.exactAlarms === "notRequired")
                ? "active"
                : "paused"
            }
          />
          {advancedDisabled ? (
            <DisabledRequirement />
          ) : permissionState?.exactAlarms === "denied" ? (
            <AppButton
              accessibilityHint="Abre a autorização de alarmes e lembretes do Android"
              accessibilityLabel="Ativar avisos no horário exato"
              icon={Settings}
              onPress={handleExactAlarm}
              title="Ativar horário exato"
              variant="ghost"
            />
          ) : (
            <AppText variant="small" muted>
              O aparelho está preparado para avisar no horário escolhido.
            </AppText>
          )}
        </AppCard>

        <AppCard style={styles.card}>
          <SettingHeader
            icon={Maximize2}
            title="Alarme em tela cheia"
            hint="Abre uma tela de alarme quando o Android permitir."
            status={
              !advancedDisabled &&
              settings.fullScreenAlarmEnabled &&
              permissionState?.fullScreen !== "denied"
                ? "active"
                : "paused"
            }
          />
          {advancedDisabled ? (
            <DisabledRequirement />
          ) : (
            <>
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <AppText style={styles.settingLabel}>Usar tela cheia</AppText>
                  <AppText variant="small" muted style={styles.hintText}>
                    O Android pode limitar este recurso conforme o aparelho.
                  </AppText>
                </View>
                <Switch
                  accessibilityLabel="Ativar alarme em tela cheia"
                  accessibilityState={{ checked: settings.fullScreenAlarmEnabled }}
                  onValueChange={handleFullScreenToggle}
                  value={settings.fullScreenAlarmEnabled}
                />
              </View>
              {settings.fullScreenAlarmEnabled &&
              permissionState?.fullScreen === "denied" ? (
                <AppButton
                  accessibilityLabel="Abrir configuração de alarme em tela cheia"
                  icon={Settings}
                  onPress={openFullScreenAlarmSettings}
                  style={styles.inlineAction}
                  title="Autorizar tela cheia"
                  variant="ghost"
                />
              ) : null}
            </>
          )}
        </AppCard>

        <AppCard style={styles.card}>
          <SettingHeader
            icon={LockKeyhole}
            title="Detalhes na tela bloqueada"
            hint="Controla quais informações aparecem sem desbloquear o aparelho."
            status={
              !advancedDisabled && settings.showLockScreenDetails
                ? "active"
                : "paused"
            }
          />
          {advancedDisabled ? (
            <DisabledRequirement />
          ) : (
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <AppText style={styles.settingLabel}>Mostrar detalhes</AppText>
                <AppText variant="small" muted style={styles.hintText}>
                  Exibe nome, dosagem e notas na tela bloqueada.
                </AppText>
              </View>
              <Switch
                accessibilityLabel="Mostrar detalhes na tela bloqueada"
                accessibilityState={{ checked: settings.showLockScreenDetails }}
                onValueChange={(value) =>
                  updateReminderSettings({ showLockScreenDetails: value })
                }
                value={settings.showLockScreenDetails}
              />
            </View>
          )}
        </AppCard>

        <AppCard style={styles.card}>
          <SettingHeader
            icon={BatteryCharging}
            title="Funcionamento em segundo plano"
            hint="Ajuda o Android a entregar os alarmes sem atraso."
            status={
              !advancedDisabled &&
              permissionState?.batteryOptimization === "unrestricted"
                ? "active"
                : "paused"
            }
          />
          {advancedDisabled ? (
            <DisabledRequirement />
          ) : permissionState?.batteryOptimization === "optimized" ? (
            <>
              <AppText variant="small" muted style={styles.bodyText}>
                A economia de bateria pode atrasar lembretes neste aparelho.
              </AppText>
              <AppButton
                accessibilityLabel="Abrir configuração de economia de bateria"
                icon={Settings}
                onPress={openBatterySettings}
                title="Revisar configuração"
                variant="ghost"
              />
            </>
          ) : (
            <AppText variant="small" muted>
              O MedMinder pode funcionar em segundo plano neste aparelho.
            </AppText>
          )}
        </AppCard>

        <AppCard style={styles.card}>
          <SettingHeader
            icon={TestTube2}
            title="Testar alarme"
            hint="Confirme som, vibração e apresentação antes de depender dos lembretes."
            status={advancedDisabled ? "paused" : "active"}
          />
          {advancedDisabled ? <DisabledRequirement /> : null}
          <AppButton
            accessibilityHint={
              advancedDisabled
                ? "Ative as notificações primeiro"
                : "Agenda um teste para daqui a cinco segundos"
            }
            accessibilityLabel="Testar alarme em cinco segundos"
            disabled={advancedDisabled}
            icon={TestTube2}
            onPress={handleAlarmTest}
            title="Testar alarme"
            variant="secondary"
          />
          {alarmTestMessage ? (
            <AppText
              accessibilityLiveRegion="polite"
              style={styles.alarmTestMessage}
              variant="small"
            >
              {alarmTestMessage}
            </AppText>
          ) : null}
        </AppCard>

        <SectionHeader title="Sobre" />
        <AppCard style={styles.card}>
          <SettingHeader
            accent
            icon={Info}
            title="MedMinder"
            hint="Versão 1.0.0"
          />
          <AppText muted>
            Aplicativo offline para lembrete de medicamentos, feito para acompanhar sua rotina diária com calma e clareza.
          </AppText>
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

function ProfileNameCard({
  editing,
  error,
  name,
  nameDraft,
  onCancel,
  onChange,
  onEdit,
  onSave,
}: {
  editing: boolean;
  error: string;
  name: string;
  nameDraft: string;
  onCancel: () => void;
  onChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
}) {
  return (
    <AppCard style={styles.card}>
      <SettingHeader icon={UserRound} title="Nome" hint="Usado na saudação da tela inicial." />
      {editing ? (
        <>
          <TextInput
            accessibilityLabel="Nome do perfil"
            autoCapitalize="words"
            onChangeText={onChange}
            placeholder="Seu nome"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, error ? styles.inputError : null]}
            value={nameDraft}
          />
          {error ? (
            <AppText
              accessibilityLiveRegion="assertive"
              accessibilityRole="alert"
              style={styles.nameError}
              variant="small"
            >
              {error}
            </AppText>
          ) : null}
          <View style={styles.editActions}>
            <AppButton
              accessibilityLabel="Cancelar edição do nome"
              onPress={onCancel}
              style={styles.editButton}
              title="Cancelar"
              variant="ghost"
            />
            <AppButton
              accessibilityLabel="Salvar nome do perfil"
              disabled={Boolean(validateProfileName(nameDraft))}
              onPress={onSave}
              style={styles.editButton}
              title="Salvar"
            />
          </View>
        </>
      ) : (
        <View style={styles.profileValueRow}>
          <AppText variant="heading" style={styles.profileName}>
            {name || "Não informado"}
          </AppText>
          <AppButton
            accessibilityLabel="Editar nome do perfil"
            compact
            onPress={onEdit}
            title="Editar"
            variant="ghost"
          />
        </View>
      )}
    </AppCard>
  );
}

function SettingHeader({
  icon: Icon,
  title,
  hint,
  status,
  accent = false,
}: {
  icon: typeof Bell;
  title: string;
  hint: string;
  status?: "active" | "paused";
  accent?: boolean;
}) {
  return (
    <View style={styles.cardHeader}>
      <View style={[styles.iconWrap, accent && styles.accentIcon]}>
        <Icon color={accent ? colors.accent : colors.primary} size={22} />
      </View>
      <View style={styles.headerText}>
        <AppText variant="subheading">{title}</AppText>
        <AppText muted style={styles.hintText}>
          {hint}
        </AppText>
      </View>
      {status ? <StatusBadge status={status} /> : null}
    </View>
  );
}

function DisabledRequirement() {
  return (
    <View
      accessible
      accessibilityLabel="Indisponível. Ative as notificações primeiro."
      style={styles.disabledRequirement}
    >
      <LockKeyhole color={colors.textMuted} size={18} />
      <AppText variant="small" muted style={styles.disabledText}>
        Ative as notificações primeiro.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  title: { color: colors.primaryDark, marginBottom: spacing.lg, marginTop: spacing.xs },
  card: { marginBottom: spacing.md },
  cardHeader: { alignItems: "center", flexDirection: "row", marginBottom: spacing.lg },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 44,
  },
  accentIcon: { backgroundColor: colors.accentSoft },
  headerText: { flex: 1, marginRight: spacing.md },
  hintText: { marginTop: spacing.xs },
  profileValueRow: { alignItems: "center", flexDirection: "row" },
  profileName: { color: colors.primaryDark, flex: 1, marginRight: spacing.md },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  inputError: { borderColor: colors.danger },
  nameError: { color: colors.danger, marginTop: spacing.sm },
  editActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  editButton: { flex: 1 },
  switchRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    paddingTop: spacing.lg,
  },
  switchText: { flex: 1, marginRight: spacing.md },
  settingLabel: { fontWeight: "700" },
  permissionBody: { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: spacing.lg },
  warningTitle: { color: colors.warning, fontWeight: "800" },
  bodyText: { marginBottom: spacing.md, marginTop: spacing.xs },
  inlineAction: { marginTop: spacing.md },
  disabledRequirement: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    flexDirection: "row",
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  disabledText: { flex: 1, marginLeft: spacing.sm },
  alarmTestMessage: { color: colors.primaryDark, marginTop: spacing.md },
});
