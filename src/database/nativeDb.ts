import { open } from "@op-engineering/op-sqlite";
import { createNativeDbAdapter } from "./nativeDbAdapter";

export type NativeDB = {
  getAllAsync: <T = any>(sql: string, ...params: any[]) => Promise<T[]>;
  getFirstAsync: <T = any>(sql: string, ...params: any[]) => Promise<T | null>;
  runAsync: (
    sql: string,
    ...params: any[]
  ) => Promise<{ lastInsertRowId: number; changes: number }>;
  execAsync: (sql: string) => Promise<void>;
  withTransactionAsync: <T>(
    task: (transaction: NativeDB) => Promise<T>
  ) => Promise<T>;
};

export async function openDatabase(name: string): Promise<NativeDB> {
  const db = await open({ name });
  return createNativeDbAdapter({
    execute: async (sql, params) => db.execute(sql, params),
  });
}
