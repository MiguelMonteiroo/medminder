import { ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import { useState, useEffect } from "react";
import { Bell, Info, Settings, UserRound } from "lucide-react-native";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { AppText } from "../components/ui/AppText";
import { Screen } from "../components/ui/Screen";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAppData } from "../services/appDataProvider";
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  openNotificationSettings,
} from "../services/notificationPermissionService";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

export function SettingsScreen() {
  const { settings, updateUserName, updateNotificationsEnabled } = useAppData();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(settings.userName);

  useEffect(() => {
    setNameDraft(settings.userName);
  }, [settings.userName]);

  useEffect(() => {
    async function check() {
      const { granted, denied } = await getNotificationPermissionStatus();
      const enabled = settings.notificationsEnabled && granted;
      setNotificationsEnabled(enabled);
      setPermissionDenied(!granted);
      if (!granted && settings.notificationsEnabled) {
        await updateNotificationsEnabled(false);
      }
      setLoading(false);
    }
    check();
  }, [settings.notificationsEnabled, updateNotificationsEnabled]);

  async function handleToggle(value: boolean) {
    setLoading(true);
    if (value) {
      const { granted } = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      setPermissionDenied(!granted);
      if (granted) {
        await updateNotificationsEnabled(true);
      }
    } else {
      setNotificationsEnabled(false);
      setPermissionDenied(false);
      await updateNotificationsEnabled(false);
    }
    setLoading(false);
  }

  async function handleOpenSettings() {
    await openNotificationSettings();
  }

  async function handleSaveName() {
    await updateUserName(nameDraft);
    setEditingName(false);
  }

  function handleCancelName() {
    setNameDraft(settings.userName);
    setEditingName(false);
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AppText variant="caption" muted>
          Perfil
        </AppText>
        <AppText variant="title" style={styles.title}>
          Seu cuidado
        </AppText>

        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <UserRound color={colors.primary} size={22} />
            </View>
            <View style={styles.headerText}>
              <AppText variant="subheading">Nome</AppText>
              <AppText muted style={styles.hint}>
                Usado na saudação da tela inicial.
              </AppText>
            </View>
            {!editingName ? (
              <AppButton
                title="Editar"
                variant="ghost"
                compact
                onPress={() => setEditingName(true)}
                accessibilityLabel="Editar nome do perfil"
              />
            ) : null}
          </View>

          {editingName ? (
            <>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Seu nome"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                accessibilityLabel="Nome do perfil"
              />
              <View style={styles.editActions}>
                <AppButton
                  title="Cancelar"
                  variant="ghost"
                  style={styles.editButton}
                  onPress={handleCancelName}
                  accessibilityLabel="Cancelar edição do nome"
                />
                <AppButton
                  title="Salvar"
                  variant="primary"
                  style={styles.editButton}
                  onPress={handleSaveName}
                  accessibilityLabel="Salvar nome do perfil"
                />
              </View>
            </>
          ) : (
            <AppText variant="heading" style={styles.profileName}>
              {settings.userName}
            </AppText>
          )}
        </AppCard>

        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <Bell color={colors.primary} size={22} />
            </View>
            <View style={styles.headerText}>
              <AppText variant="subheading">Notificações</AppText>
              <AppText muted style={styles.hint}>
                Cuide da rotina com lembretes locais no seu aparelho.
              </AppText>
            </View>
            <StatusBadge status={permissionDenied && !notificationsEnabled ? "paused" : notificationsEnabled ? "active" : "paused"} />
          </View>

          {permissionDenied && !notificationsEnabled ? (
            <View style={styles.deniedState}>
              <AppText style={styles.deniedTitle}>
                Permissão negada
              </AppText>
              <AppText variant="small" muted style={styles.deniedText}>
                As notificações foram bloqueadas. Para receber lembretes, autorize
                as notificações nas configurações do aparelho.
              </AppText>
              <AppButton
                title="Abrir configurações"
                variant="secondary"
                icon={Settings}
                onPress={handleOpenSettings}
                style={styles.settingsButton}
                accessibilityLabel="Abrir configurações de notificação"
              />
            </View>
          ) : (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <AppText style={styles.label}>Lembretes</AppText>
                <AppText variant="small" muted style={styles.hint}>
                  {notificationsEnabled
                    ? "Notificações ativadas para a rotina."
                    : "Ative para receber lembretes dos medicamentos."}
                </AppText>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggle}
                disabled={loading}
                thumbColor={notificationsEnabled ? colors.primary : colors.surface}
                trackColor={{
                  false: colors.surfaceMuted,
                  true: colors.primarySoft,
                }}
                accessibilityLabel="Ativar notificações"
              />
            </View>
          )}
        </AppCard>

        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, styles.accentIcon]}>
              <Info color={colors.accent} size={22} />
            </View>
            <View style={styles.headerText}>
              <AppText variant="subheading">Sobre</AppText>
              <AppText muted style={styles.hint}>
                MedMinder v1.0.0
              </AppText>
            </View>
          </View>
          <AppText muted>
            Aplicativo offline para lembrete de medicamentos, feito para acompanhar
            sua rotina diária com calma, clareza e carinho.
          </AppText>
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.primaryDark,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 44,
  },
  accentIcon: {
    backgroundColor: colors.accentSoft,
  },
  headerText: {
    flex: 1,
    marginRight: spacing.md,
  },
  profileName: {
    color: colors.primaryDark,
  },
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
  editActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  editButton: {
    flex: 1,
  },
  row: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    paddingTop: spacing.lg,
  },
  rowInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontWeight: "700",
  },
  hint: {
    marginTop: spacing.xs,
  },
  deniedState: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.lg,
  },
  deniedTitle: {
    color: colors.warning,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  deniedText: {
    marginBottom: spacing.md,
  },
  settingsButton: {
    alignSelf: "flex-start",
  },
});
