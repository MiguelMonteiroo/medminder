import type { NativeDB } from "./nativeDb";

type DriverResult = {
  rows?: any[];
  insertId?: number;
  rowsAffected: number;
};

export type NativeDriver = {
  execute: (sql: string, params: any[]) => Promise<DriverResult>;
};

export function createNativeDbAdapter(driver: NativeDriver): NativeDB {
  let operationQueue: Promise<void> = Promise.resolve();

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = operationQueue.then(operation, operation);
    operationQueue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  const direct: NativeDB = {
    getAllAsync: async <T>(sql: string, ...params: any[]): Promise<T[]> => {
      const result = await driver.execute(sql, params);
      return (result.rows ?? []) as T[];
    },
    getFirstAsync: async <T>(
      sql: string,
      ...params: any[]
    ): Promise<T | null> => {
      const result = await driver.execute(sql, params);
      const rows = result.rows ?? [];
      return rows.length > 0 ? (rows[0] as T) : null;
    },
    runAsync: async (sql: string, ...params: any[]) => {
      const result = await driver.execute(sql, params);
      return {
        lastInsertRowId: result.insertId ?? 0,
        changes: result.rowsAffected,
      };
    },
    execAsync: async (sql: string): Promise<void> => {
      const statements = sql
        .split(";")
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0);

      for (const statement of statements) {
        await driver.execute(statement, []);
      }
    },
    withTransactionAsync: async <T>(
      task: (transaction: NativeDB) => Promise<T>
    ): Promise<T> => task(direct),
  };

  return {
    getAllAsync: <T>(sql: string, ...params: any[]) =>
      enqueue(() => direct.getAllAsync<T>(sql, ...params)),
    getFirstAsync: <T>(sql: string, ...params: any[]) =>
      enqueue(() => direct.getFirstAsync<T>(sql, ...params)),
    runAsync: (sql: string, ...params: any[]) =>
      enqueue(() => direct.runAsync(sql, ...params)),
    execAsync: (sql: string) => enqueue(() => direct.execAsync(sql)),
    withTransactionAsync: <T>(
      task: (transaction: NativeDB) => Promise<T>
    ): Promise<T> =>
      enqueue(async () => {
        await driver.execute("BEGIN IMMEDIATE", []);
        try {
          const result = await task(direct);
          await driver.execute("COMMIT", []);
          return result;
        } catch (error) {
          try {
            await driver.execute("ROLLBACK", []);
          } catch {
            // Preserve the original failure when rollback also fails.
          }
          throw error;
        }
      }),
  };
}
