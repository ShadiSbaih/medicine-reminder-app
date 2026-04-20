import { dbManager } from "@/database/DatabaseManager";
import type { DoseHistory } from "@/utils/storage";

type DoseStatus = "taken" | "missed" | "skipped";

type DoseHistoryRow = {
  id: string;
  medication_id: string;
  timestamp: string;
  taken: number;
  status: string;
  scheduled_time: string | null;
};

export interface LogDoseInput {
  medicationId: string;
  taken: boolean;
  timestamp: string;
  scheduledTime?: string;
  status?: DoseStatus;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function extractDoseDate(timestamp: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(timestamp)) {
    return timestamp.slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizeStatus(input: LogDoseInput): DoseStatus {
  if (
    input.status === "taken" ||
    input.status === "missed" ||
    input.status === "skipped"
  ) {
    return input.status;
  }

  return input.taken ? "taken" : "missed";
}

class DoseHistoryRepository {
  private mapRow(row: DoseHistoryRow): DoseHistory {
    const rawStatus = row.status;
    const status: DoseStatus =
      rawStatus === "taken" || rawStatus === "missed" || rawStatus === "skipped"
        ? rawStatus
        : row.taken === 1
          ? "taken"
          : "missed";

    return {
      id: row.id,
      medicationId: row.medication_id,
      timestamp: row.timestamp,
      taken: row.taken === 1,
      status,
      scheduledTime: row.scheduled_time ?? undefined,
    };
  }

  async listAll(): Promise<DoseHistory[]> {
    const db = dbManager.getSQLite();
    const rows = await db.getAllAsync<DoseHistoryRow>(
      `SELECT id, medication_id, timestamp, taken, status, scheduled_time
       FROM dose_history
       ORDER BY datetime(timestamp) DESC`,
    );

    return rows.map((row) => this.mapRow(row));
  }

  async listForDate(doseDate: string): Promise<DoseHistory[]> {
    const db = dbManager.getSQLite();
    const rows = await db.getAllAsync<DoseHistoryRow>(
      `SELECT id, medication_id, timestamp, taken, status, scheduled_time
       FROM dose_history
       WHERE dose_date = ?
       ORDER BY datetime(timestamp) ASC`,
      doseDate,
    );

    return rows.map((row) => this.mapRow(row));
  }

  async listToday(): Promise<DoseHistory[]> {
    const today = new Date().toISOString().slice(0, 10);
    return this.listForDate(today);
  }

  async findByMedicationDateTime(
    medicationId: string,
    doseDate: string,
    scheduledTime: string | null,
  ): Promise<DoseHistory | null> {
    const db = dbManager.getSQLite();
    const row = await db.getFirstAsync<DoseHistoryRow>(
      `SELECT id, medication_id, timestamp, taken, status, scheduled_time
       FROM dose_history
       WHERE medication_id = ?
         AND dose_date = ?
         AND (scheduled_time = ? OR (scheduled_time IS NULL AND ? IS NULL))`,
      medicationId,
      doseDate,
      scheduledTime,
      scheduledTime,
    );

    return row ? this.mapRow(row) : null;
  }

  async logDose(input: LogDoseInput): Promise<DoseHistory> {
    const db = dbManager.getSQLite();
    const id = generateId();
    const status = normalizeStatus(input);
    const doseDate = extractDoseDate(input.timestamp);

    await db.runAsync(
      `INSERT INTO dose_history (
        id, medication_id, timestamp, taken, status, scheduled_time,
        dose_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(medication_id, dose_date, scheduled_time)
      DO UPDATE SET
        timestamp = excluded.timestamp,
        taken = excluded.taken,
        status = excluded.status,
        updated_at = datetime('now')`,
      id,
      input.medicationId,
      input.timestamp,
      status === "taken" ? 1 : 0,
      status,
      input.scheduledTime ?? null,
      doseDate,
    );

    const saved = await this.findByMedicationDateTime(
      input.medicationId,
      doseDate,
      input.scheduledTime ?? null,
    );

    if (!saved) {
      throw new Error("Dose record could not be retrieved after write.");
    }

    return saved;
  }

  async clearAll(): Promise<void> {
    const db = dbManager.getSQLite();
    await db.runAsync(`DELETE FROM dose_history`);
  }
}

export const doseHistoryRepository = new DoseHistoryRepository();
