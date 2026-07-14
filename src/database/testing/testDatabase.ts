import type { NativeDB } from "../nativeDb";
import {
  createNativeDbAdapter,
  type NativeDriver,
} from "../nativeDbAdapter";

declare const require: (name: string) => any;

const { DatabaseSync } = require("node:sqlite");

export function createTestDatabase(): {
  db: NativeDB;
  close: () => void;
  execScript: (sql: string) => void;
} {
  const sqlite = new DatabaseSync(":memory:");
  const driver: NativeDriver = {
    async execute(sql: string, params: any[]) {
      const statement = sqlite.prepare(sql);
      if (statement.columns().length > 0) {
        return {
          rows: statement.all(...params),
          rowsAffected: 0,
        };
      }

      const result = statement.run(...params);
      return {
        insertId: Number(result.lastInsertRowid ?? 0),
        rowsAffected: Number(result.changes ?? 0),
      };
    },
  };
  const db = createNativeDbAdapter(driver);

  return {
    db,
    close: () => sqlite.close(),
    execScript: (sql: string) => sqlite.exec(sql),
  };
}
