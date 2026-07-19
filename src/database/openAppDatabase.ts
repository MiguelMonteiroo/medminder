import { migrateDbIfNeeded } from "./migrations";
import { NativeDB, openDatabase } from "./nativeDb";

type BootstrapStage = "open" | "migration";

type DatabaseBootstrapDependencies = {
  openDatabase: (name: string) => Promise<NativeDB>;
  migrateDbIfNeeded: (database: NativeDB) => Promise<void>;
  wait: (milliseconds: number) => Promise<void>;
  maxAttempts?: number;
  retryDelayMs?: number;
  onAttemptFailed?: (details: {
    attempt: number;
    errorType: string;
    stage: BootstrapStage;
  }) => void;
};

function getErrorType(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

export function createDatabaseBootstrap({
  openDatabase: openNativeDatabase,
  migrateDbIfNeeded: migrate,
  wait,
  maxAttempts = 2,
  retryDelayMs = 150,
  onAttemptFailed,
}: DatabaseBootstrapDependencies) {
  let sharedPromise: Promise<NativeDB> | null = null;

  async function bootstrap(): Promise<NativeDB> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      let stage: BootstrapStage = "open";
      try {
        const database = await openNativeDatabase("medminder.db");
        stage = "migration";
        await migrate(database);
        return database;
      } catch (error) {
        lastError = error;
        onAttemptFailed?.({
          attempt,
          errorType: getErrorType(error),
          stage,
        });
        if (attempt < maxAttempts) await wait(retryDelayMs);
      }
    }

    throw lastError;
  }

  function open(): Promise<NativeDB> {
    if (sharedPromise) return sharedPromise;

    const nextPromise = bootstrap().catch((error) => {
      if (sharedPromise === nextPromise) sharedPromise = null;
      throw error;
    });
    sharedPromise = nextPromise;
    return nextPromise;
  }

  function resetForExplicitRetry(): void {
    sharedPromise = null;
  }

  return { open, resetForExplicitRetry };
}

const appDatabaseBootstrap = createDatabaseBootstrap({
  openDatabase,
  migrateDbIfNeeded,
  wait: (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
  onAttemptFailed: __DEV__
    ? ({ attempt, errorType, stage }) => {
        console.warn("[database] bootstrap attempt failed", {
          attempt,
          errorType,
          stage,
        });
      }
    : undefined,
});

export function openAppDatabase(): Promise<NativeDB> {
  return appDatabaseBootstrap.open();
}

export function resetAppDatabaseForRetry(): void {
  appDatabaseBootstrap.resetForExplicitRetry();
}
