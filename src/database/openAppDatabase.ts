import { migrateDbIfNeeded } from "./migrations";
import { NativeDB, openDatabase } from "./nativeDb";

let databasePromise: Promise<NativeDB> | null = null;

export function openAppDatabase(): Promise<NativeDB> {
  if (!databasePromise) {
    databasePromise = openDatabase("medminder.db").then(async (database) => {
      await migrateDbIfNeeded(database);
      return database;
    });
  }

  return databasePromise;
}

export function resetAppDatabaseForRetry(): void {
  databasePromise = null;
}
