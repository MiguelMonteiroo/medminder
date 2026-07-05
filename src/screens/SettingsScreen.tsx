import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { useState, useEffect } from "react";
import { Bell, Info } from "lucide-react-native";
import { AppCard } from "../components/ui/AppCard";
import { AppText } from "../components/ui/AppText";
import { Screen } from "../components/ui/Screen";
import { StatusBadge } from "../components/ui/StatusBadge";
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from "../services/notificationPermissionService";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

export function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const { granted } = await getNotificationPermissionStatus();
      setNotificationsEnabled(granted);
      setLoading(false);
    }
    check();
  }, []);

  async function handleToggle(value: boolean) {
    if (value) {
      const { granted } = await requestNotificationPermission();
      setNotificationsEnabled(granted);
    } else {
      setNotificationsEnabled(false);
    }
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
              <Bell color={colors.primary} size={22} />
            </View>
            <View style={styles.headerText}>
              <AppText variant="subheading">Notificações</AppText>
              <AppText muted style={styles.hint}>
                Cuide da rotina com lembretes locais no seu aparelho.
              </AppText>
            </View>
            <StatusBadge status={notificationsEnabled ? "active" : "paused"} />
          </View>

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
});
