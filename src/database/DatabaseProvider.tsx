import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Database, RefreshCw } from "lucide-react-native";
import { NativeDB } from "./nativeDb";
import { openAppDatabase, resetAppDatabaseForRetry } from "./openAppDatabase";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { AppText } from "../components/ui/AppText";
import { Screen } from "../components/ui/Screen";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

interface DatabaseContextValue {
  db: NativeDB | null;
  initialized: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  initialized: false,
  error: null,
});

export function useDatabase(): NativeDB {
  const ctx = useContext(DatabaseContext);
  if (!ctx.db) {
    throw new Error("Database not initialized. Ensure DatabaseProvider wraps your app.");
  }
  return ctx.db;
}

export function useDatabaseStatus() {
  return useContext(DatabaseContext);
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DatabaseContextValue>({
    db: null,
    initialized: false,
    error: null,
  });
  const initRef = useRef(false);

  const initialize = useCallback(async () => {
    try {
      setState({ db: null, initialized: false, error: null });
      resetAppDatabaseForRetry();
      const db = await openAppDatabase();
      setState({ db, initialized: true, error: null });
    } catch (e: any) {
      setState({
        db: null,
        initialized: true,
        error: e?.message ?? "Erro ao inicializar banco de dados.",
      });
    }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initialize();
  }, [initialize]);

  if (state.error) {
    return (
      <Screen style={styles.centeredScreen}>
        <AppCard accessibilityRole="alert" style={styles.statusCard}>
          <View style={styles.iconContainer}>
            <Database color={colors.primaryDark} size={30} strokeWidth={2} />
          </View>
          <AppText variant="heading" style={styles.statusTitle}>
            Não foi possível acessar seus dados
          </AppText>
          <AppText muted style={styles.statusMessage}>
            Nada foi apagado. Tente abrir o armazenamento do MedMinder
            novamente.
          </AppText>
          <AppButton
            accessibilityLabel="Tentar abrir os dados novamente"
            accessibilityHint="Repete a inicialização do armazenamento local"
            icon={RefreshCw}
            title="Tentar novamente"
          onPress={initialize}
          />
        </AppCard>
      </Screen>
    );
  }

  if (!state.initialized) {
    return (
      <Screen style={styles.centeredScreen}>
        <View
          accessibilityLabel="Preparando seus dados"
          accessibilityRole="progressbar"
          style={styles.loadingContent}
        >
          <ActivityIndicator color={colors.primaryDark} size="large" />
          <AppText muted>Preparando seus dados...</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <DatabaseContext.Provider value={state}>
      {children}
    </DatabaseContext.Provider>
  );
}

const styles = StyleSheet.create({
  centeredScreen: {
    justifyContent: "center",
  },
  statusCard: {
    alignSelf: "center",
    maxWidth: 440,
    width: "100%",
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    height: 52,
    justifyContent: "center",
    marginBottom: spacing.lg,
    width: 52,
  },
  statusTitle: {
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  statusMessage: {
    marginBottom: spacing.xl,
  },
  loadingContent: {
    alignItems: "center",
    gap: spacing.md,
  },
});
