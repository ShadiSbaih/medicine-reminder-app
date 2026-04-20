import { dbManager } from "@/database/DatabaseManager";
import { isMedicationActiveOnDate } from "@/shared/utils/medication-schedule";
import type { Medication } from "@/utils/storage";

export type CreateMedicationInput = Omit<Medication, "id" | "color"> & {
  id?: string;
  color?: string;
};

type MedicationRow = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string;
  start_date: string;
  duration: string;
  notes: string | null;
  color: string;
  reminder_enabled: number;
  current_supply: number;
  total_supply: number;
  refill_at: number;
  refill_reminder: number;
  last_refill_date: string | null;
  created_at: string;
  updated_at: string;
};

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function parseTimes(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

class MedicationRepository {
  private mapRow(row: MedicationRow): Medication {
    return {
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      times: parseTimes(row.times),
      startDate: row.start_date,
      duration: row.duration,
      notes: row.notes ?? undefined,
      color: row.color,
      reminderEnabled: row.reminder_enabled === 1,
      currentSupply: Number(row.current_supply),
      totalSupply: Number(row.total_supply),
      refillAt: Number(row.refill_at),
      refillReminder: row.refill_reminder === 1,
      lastRefillDate: row.last_refill_date ?? undefined,
    };
  }

  async findAll(): Promise<Medication[]> {
    const db = dbManager.getSQLite();
    const rows = await db.getAllAsync<MedicationRow>(
      `SELECT * FROM medications
       WHERE is_deleted = 0
       ORDER BY datetime(created_at) ASC`,
    );

    return rows.map((row) => this.mapRow(row));
  }

  async findById(id: string): Promise<Medication | null> {
    const db = dbManager.getSQLite();
    const row = await db.getFirstAsync<MedicationRow>(
      `SELECT * FROM medications
       WHERE id = ? AND is_deleted = 0`,
      id,
    );

    return row ? this.mapRow(row) : null;
  }

  async findActiveOnDate(date: Date): Promise<Medication[]> {
    const medications = await this.findAll();
    return medications.filter((medication) =>
      isMedicationActiveOnDate(medication, date),
    );
  }

  async create(input: CreateMedicationInput): Promise<Medication> {
    const db = dbManager.getSQLite();
    const now = new Date().toISOString();
    const id = input.id ?? generateId();

    await db.runAsync(
      `INSERT INTO medications (
        id, name, dosage, frequency, times, start_date, duration,
        notes, color, reminder_enabled, current_supply, total_supply,
        refill_at, refill_reminder, last_refill_date, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      id,
      input.name,
      input.dosage,
      input.frequency,
      JSON.stringify(input.times ?? []),
      input.startDate,
      input.duration,
      input.notes ?? null,
      input.color ?? "#2DB19A",
      input.reminderEnabled ? 1 : 0,
      input.currentSupply ?? 0,
      input.totalSupply ?? 0,
      input.refillAt ?? 0,
      input.refillReminder ? 1 : 0,
      input.lastRefillDate ?? null,
      now,
      now,
    );

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`Failed to create medication ${id}`);
    }

    return created;
  }

  async update(medication: Medication): Promise<Medication> {
    const db = dbManager.getSQLite();

    await db.runAsync(
      `UPDATE medications SET
        name = ?,
        dosage = ?,
        frequency = ?,
        times = ?,
        start_date = ?,
        duration = ?,
        notes = ?,
        color = ?,
        reminder_enabled = ?,
        current_supply = ?,
        total_supply = ?,
        refill_at = ?,
        refill_reminder = ?,
        last_refill_date = ?,
        updated_at = datetime('now')
       WHERE id = ? AND is_deleted = 0`,
      medication.name,
      medication.dosage,
      medication.frequency,
      JSON.stringify(medication.times ?? []),
      medication.startDate,
      medication.duration,
      medication.notes ?? null,
      medication.color,
      medication.reminderEnabled ? 1 : 0,
      medication.currentSupply,
      medication.totalSupply,
      medication.refillAt,
      medication.refillReminder ? 1 : 0,
      medication.lastRefillDate ?? null,
      medication.id,
    );

    const updated = await this.findById(medication.id);
    if (!updated) {
      throw new Error(`Failed to update medication ${medication.id}`);
    }

    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const db = dbManager.getSQLite();
    await db.runAsync(
      `UPDATE medications
       SET is_deleted = 1,
           updated_at = datetime('now')
       WHERE id = ?`,
      id,
    );
  }

  async hardDelete(id: string): Promise<void> {
    const db = dbManager.getSQLite();
    await db.runAsync(`DELETE FROM medications WHERE id = ?`, id);
  }

  async decrementSupply(
    medicationId: string,
    amount: number = 1,
  ): Promise<{ before: number; after: number }> {
    const db = dbManager.getSQLite();

    let before = 0;
    let after = 0;

    await db.withTransactionAsync(async () => {
      const row = await db.getFirstAsync<{ current_supply: number }>(
        `SELECT current_supply
         FROM medications
         WHERE id = ? AND is_deleted = 0`,
        medicationId,
      );

      if (!row) {
        throw new Error(`Medication ${medicationId} was not found`);
      }

      before = Number(row.current_supply);
      after = Math.max(0, before - amount);

      await db.runAsync(
        `UPDATE medications
         SET current_supply = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        after,
        medicationId,
      );
    });

    return { before, after };
  }
}

export const medicationRepository = new MedicationRepository();
