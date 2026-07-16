jest.mock("@op-engineering/op-sqlite", () => ({ open: jest.fn() }));

import { createDatabaseBootstrap } from "../openAppDatabase";
import type { NativeDB } from "../nativeDb";

const database = {} as NativeDB;

describe("createDatabaseBootstrap", () => {
  it("recovers from a transient first-open failure before exposing an error", async () => {
    const openDatabase = jest
      .fn<Promise<NativeDB>, [string]>()
      .mockRejectedValueOnce(new Error("native module warming up"))
      .mockResolvedValue(database);
    const migrateDbIfNeeded = jest.fn().mockResolvedValue(undefined);
    const wait = jest.fn().mockResolvedValue(undefined);
    const bootstrap = createDatabaseBootstrap({
      openDatabase,
      migrateDbIfNeeded,
      wait,
      retryDelayMs: 25,
    });

    await expect(bootstrap.open()).resolves.toBe(database);
    expect(openDatabase).toHaveBeenCalledTimes(2);
    expect(migrateDbIfNeeded).toHaveBeenCalledTimes(1);
    expect(wait).toHaveBeenCalledWith(25);
  });

  it("shares one bootstrap promise between concurrent callers", async () => {
    let resolveDatabase!: (value: NativeDB) => void;
    const pendingDatabase = new Promise<NativeDB>((resolve) => {
      resolveDatabase = resolve;
    });
    const openDatabase = jest.fn().mockReturnValue(pendingDatabase);
    const migrateDbIfNeeded = jest.fn().mockResolvedValue(undefined);
    const bootstrap = createDatabaseBootstrap({
      openDatabase,
      migrateDbIfNeeded,
      wait: async () => undefined,
    });

    const first = bootstrap.open();
    const second = bootstrap.open();

    expect(first).toBe(second);
    expect(openDatabase).toHaveBeenCalledTimes(1);

    resolveDatabase(database);
    await expect(first).resolves.toBe(database);
    expect(migrateDbIfNeeded).toHaveBeenCalledTimes(1);
  });

  it("clears a rejected promise so a later explicit retry can recover", async () => {
    const openDatabase = jest
      .fn<Promise<NativeDB>, [string]>()
      .mockRejectedValueOnce(new TypeError("first failure"))
      .mockRejectedValueOnce(new TypeError("second failure"))
      .mockResolvedValue(database);
    const bootstrap = createDatabaseBootstrap({
      openDatabase,
      migrateDbIfNeeded: jest.fn().mockResolvedValue(undefined),
      wait: async () => undefined,
    });

    await expect(bootstrap.open()).rejects.toThrow("second failure");
    await expect(bootstrap.open()).resolves.toBe(database);
    expect(openDatabase).toHaveBeenCalledTimes(3);
  });
});
