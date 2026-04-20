import { dbManager } from "@/database/DatabaseManager";
import { migrateFromAsyncStorage } from "@/database/migrations/legacyMigration";

export interface DatabaseBootstrapResult {
  migrated: boolean;
  medications: number;
  doses: number;
}

export async function bootstrapDatabase(): Promise<DatabaseBootstrapResult> {
  await dbManager.initialize();
  return migrateFromAsyncStorage();
}
