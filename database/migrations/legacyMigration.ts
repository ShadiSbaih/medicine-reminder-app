import { dbManager } from "@/database/DatabaseManager";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LEGACY_MEDICATIONS_KEY = "@medications";
const LEGACY_DOSE_HISTORY_KEY = "@dose_history";
const MIGRATION_FLAG_KEY = "@pillora_v2_migrated";

type LegacyMedication = {
  id?: unknown;
  name?: unknown;
  dosage?: unknown;
  frequency?: unknown;
  times?: unknown;
  startDate?: unknown;
  duration?: unknown;
  notes?: unknown;
  color?: unknown;
  reminderEnabled?: unknown;
  currentSupply?: unknown;
  totalSupply?: unknown;
  refillAt?: unknown;
  refillReminder?: unknown;
  lastRefillDate?: unknown;
};

type LegacyDoseHistory = {
  id?: unknown;
  medicationId?: unknown;
  timestamp?: unknown;
  taken?: unknown;
  status?: unknown;
  scheduledTime?: unknown;
};

type DoseStatus = "taken" | "missed" | "skipped";

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function parseArray<T>(raw: string | null): T[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as T[];
  } catch {
    return [];
  }
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function normalizeStatus(legacy: LegacyDoseHistory): DoseStatus {
  if (
    legacy.status === "taken" ||
    legacy.status === "missed" ||
    legacy.status === "skipped"
  ) {
    return legacy.status;
  }

  return toBoolean(legacy.taken, false) ? "taken" : "missed";
}

function resolveDoseDate(timestamp: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(timestamp)) {
    return timestamp.slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function parseTimes(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

export interface LegacyMigrationResult {
  migrated: boolean;
  medications: number;
  doses: number;
}

export async function migrateFromAsyncStorage(): Promise<LegacyMigrationResult> {
  const alreadyMigrated = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
  if (alreadyMigrated === "true") {
    return { migrated: false, medications: 0, doses: 0 };
  }

  const [legacyMedicationsRaw, legacyDoseHistoryRaw] = await Promise.all([
    AsyncStorage.getItem(LEGACY_MEDICATIONS_KEY),
    AsyncStorage.getItem(LEGACY_DOSE_HISTORY_KEY),
  ]);

  const legacyMedications = parseArray<LegacyMedication>(legacyMedicationsRaw);
  const legacyDoseHistory = parseArray<LegacyDoseHistory>(legacyDoseHistoryRaw);

  if (legacyMedications.length === 0 && legacyDoseHistory.length === 0) {
    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "true");
    return { migrated: false, medications: 0, doses: 0 };
  }

  const db = dbManager.getSQLite();
  let medicationsMigrated = 0;
  let dosesMigrated = 0;

  await db.withTransactionAsync(async () => {
    for (const legacyMedication of legacyMedications) {
      const name =
        typeof legacyMedication.name === "string"
          ? legacyMedication.name.trim()
          : "";
      const dosage =
        typeof legacyMedication.dosage === "string"
          ? legacyMedication.dosage.trim()
          : "";

      if (!name || !dosage) {
        continue;
      }

      const medicationId =
        typeof legacyMedication.id === "string" &&
        legacyMedication.id.length > 0
          ? legacyMedication.id
          : generateId();

      const startDate =
        typeof legacyMedication.startDate === "string" &&
        legacyMedication.startDate.length > 0
          ? legacyMedication.startDate
          : new Date().toISOString();

      const created = await db.runAsync(
        `INSERT OR IGNORE INTO medications (
          id, name, dosage, frequency, times, start_date, duration,
          notes, color, reminder_enabled, current_supply, total_supply,
          refill_at, refill_reminder, last_refill_date, created_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        medicationId,
        name,
        dosage,
        typeof legacyMedication.frequency === "string" &&
          legacyMedication.frequency.length > 0
          ? legacyMedication.frequency
          : "As needed",
        JSON.stringify(parseTimes(legacyMedication.times)),
        startDate,
        typeof legacyMedication.duration === "string" &&
          legacyMedication.duration.length > 0
          ? legacyMedication.duration
          : "Ongoing",
        typeof legacyMedication.notes === "string"
          ? legacyMedication.notes
          : null,
        typeof legacyMedication.color === "string" &&
          legacyMedication.color.length > 0
          ? legacyMedication.color
          : "#2DB19A",
        toBoolean(legacyMedication.reminderEnabled, true) ? 1 : 0,
        toNumber(legacyMedication.currentSupply),
        toNumber(legacyMedication.totalSupply),
        toNumber(legacyMedication.refillAt),
        toBoolean(legacyMedication.refillReminder, false) ? 1 : 0,
        typeof legacyMedication.lastRefillDate === "string"
          ? legacyMedication.lastRefillDate
          : null,
        startDate,
        startDate,
      );

      medicationsMigrated += created.changes;
    }

    for (const legacyDose of legacyDoseHistory) {
      if (
        typeof legacyDose.medicationId !== "string" ||
        legacyDose.medicationId.length === 0
      ) {
        continue;
      }

      const timestamp =
        typeof legacyDose.timestamp === "string" &&
        legacyDose.timestamp.length > 0
          ? legacyDose.timestamp
          : new Date().toISOString();
      const status = normalizeStatus(legacyDose);

      const created = await db.runAsync(
        `INSERT OR IGNORE INTO dose_history (
          id, medication_id, timestamp, taken, status, scheduled_time,
          dose_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        typeof legacyDose.id === "string" && legacyDose.id.length > 0
          ? legacyDose.id
          : generateId(),
        legacyDose.medicationId,
        timestamp,
        status === "taken" ? 1 : 0,
        status,
        typeof legacyDose.scheduledTime === "string" &&
          legacyDose.scheduledTime.length > 0
          ? legacyDose.scheduledTime
          : null,
        resolveDoseDate(timestamp),
        timestamp,
        timestamp,
      );

      dosesMigrated += created.changes;
    }
  });

  await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "true");

  console.log(
    `[LegacyMigration] Migrated ${medicationsMigrated} medications and ${dosesMigrated} dose records.`,
  );

  return {
    migrated: true,
    medications: medicationsMigrated,
    doses: dosesMigrated,
  };
}
