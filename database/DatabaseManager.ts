import { migrations } from "@/database/migrations";
import * as schema from "@/database/schema";
import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";

class DatabaseManager {
  private static instance: DatabaseManager;

  private sqlite: SQLite.SQLiteDatabase | null = null;
  private orm: ExpoSQLiteDatabase<typeof schema> | null = null;
  private readonly DB_NAME = "pillora_v2.db";

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.sqlite && this.orm) {
      return;
    }

    try {
      this.sqlite = SQLite.openDatabaseSync(this.DB_NAME);
      this.orm = drizzle(this.sqlite, { schema });
      await this.configurePragmas();
      await this.runMigrations();
    } catch (error) {
      this.sqlite = null;
      this.orm = null;
      console.error("[DatabaseManager] Failed to initialize database:", error);
      throw new Error("Database initialization failed");
    }
  }

  private async configurePragmas(): Promise<void> {
    const db = this.getSQLite();
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA cache_size = -8000;
      PRAGMA synchronous = NORMAL;
    `);
  }

  async runMigrations(): Promise<void> {
    const db = this.getSQLite();

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now')),
        checksum TEXT NOT NULL
      );
    `);

    const appliedRows = await db.getAllAsync<{ version: number }>(
      "SELECT version FROM schema_migrations ORDER BY version ASC",
    );
    const appliedVersions = new Set(appliedRows.map((row) => row.version));

    const orderedMigrations = [...migrations].sort(
      (a, b) => a.version - b.version,
    );

    for (const migration of orderedMigrations) {
      if (appliedVersions.has(migration.version)) {
        continue;
      }

      await db.withTransactionAsync(async () => {
        await db.execAsync(migration.sql);
        await db.runAsync(
          "INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)",
          migration.version,
          migration.name,
          migration.checksum,
        );
      });

      console.log(
        `[DatabaseManager] Applied migration v${migration.version}: ${migration.name}`,
      );
    }
  }

  getSQLite(): SQLite.SQLiteDatabase {
    if (!this.sqlite) {
      throw new Error("Database has not been initialized.");
    }
    return this.sqlite;
  }

  getORM(): ExpoSQLiteDatabase<typeof schema> {
    if (!this.orm) {
      throw new Error("Database ORM has not been initialized.");
    }
    return this.orm;
  }

  async withTransaction<T>(operation: () => Promise<T>): Promise<T> {
    const db = this.getSQLite();
    let hasResult = false;
    let result!: T;

    await db.withTransactionAsync(async () => {
      result = await operation();
      hasResult = true;
    });

    if (!hasResult) {
      throw new Error("Transaction operation did not produce a result.");
    }

    return result;
  }

  async close(): Promise<void> {
    if (!this.sqlite) {
      return;
    }

    await this.sqlite.closeAsync();
    this.sqlite = null;
    this.orm = null;
  }
}

export const dbManager = DatabaseManager.getInstance();
