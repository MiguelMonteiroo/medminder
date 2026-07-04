import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NativeDB, openDatabase } from "./nativeDb";
import { migrateDbIfNeeded } from "./migrations";

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
      const db = await openDatabase("medminder.db");
      await migrateDbIfNeeded(db);
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
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Nao foi possivel abrir o banco</Text>
        <Text style={styles.errorMessage}>{state.error}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tentar inicializar o banco novamente"
          onPress={initialize}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (!state.initialized) {
    return null;
  }

  return (
    <DatabaseContext.Provider value={state}>
      {children}
    </DatabaseContext.Provider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8F4EF",
  },
  errorTitle: {
    color: "#241F1A",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorMessage: {
    color: "#5F554B",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#D96C3F",
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
