import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
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
    }

    init();
  }, []);

  if (state.error) {
    throw new Error(state.error);
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
