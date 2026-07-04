import { View, Text, StyleSheet, Switch, Pressable } from "react-native";
import { useState, useEffect } from "react";
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from "../services/notificationPermissionService";

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
    <View style={styles.container}>
      <Text style={styles.title}>Configurações</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.label}>Lembretes</Text>
            <Text style={styles.hint}>
              {notificationsEnabled
                ? "Notificações ativadas"
                : "Ative para receber lembretes dos medicamentos"}
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggle}
            disabled={loading}
            accessibilityLabel="Ativar notificações"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        <Text style={styles.aboutText}>MedMinder v1.0.0</Text>
        <Text style={styles.aboutText}>
          Aplicativo offline para lembrete de medicamentos.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  hint: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  aboutText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
});
