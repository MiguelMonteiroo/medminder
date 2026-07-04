import { open, type DB as OPSQLiteDB } from "@op-engineering/op-sqlite";

export type NativeDB = {
  getAllAsync: <T = any>(sql: string, ...params: any[]) => Promise<T[]>;
  getFirstAsync: <T = any>(sql: string, ...params: any[]) => Promise<T | null>;
  runAsync: (
    sql: string,
    ...params: any[]
  ) => Promise<{ lastInsertRowId: number; changes: number }>;
  execAsync: (sql: string) => Promise<void>;
};

function normalizeParams(params?: any | any[]): any[] {
  if (params === undefined || params === null) return [];
  if (Array.isArray(params)) return params;
  return [params];
}

export async function openDatabase(name: string): Promise<NativeDB> {
  const db = await open({ name });
  return createAdapter(db);
}

function createAdapter(db: OPSQLiteDB): NativeDB {
  return {
    getAllAsync: async <T>(sql: string, ...params: any[]): Promise<T[]> => {
      const result = await db.execute(sql, params);
      return (result.rows ?? []) as T[];
    },

    getFirstAsync: async <T>(
      sql: string,
      ...params: any[]
    ): Promise<T | null> => {
      const result = await db.execute(sql, params);
      const rows = result.rows ?? [];
      return rows.length > 0 ? (rows[0] as T) : null;
    },

    runAsync: async (
      sql: string,
      ...params: any[]
    ): Promise<{ lastInsertRowId: number; changes: number }> => {
      const result = await db.execute(sql, params);
      return {
        lastInsertRowId: result.insertId ?? 0,
        changes: result.rowsAffected,
      };
    },

    execAsync: async (sql: string): Promise<void> => {
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (statements.length === 0) return;

      for (const stmt of statements) {
        await db.execute(stmt);
      }
    },
  };
}
