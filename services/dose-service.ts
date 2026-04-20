import { bootstrapDatabase, dbManager } from "@/database";
import {
    doseHistoryRepository,
    medicationRepository,
} from "@/database/repositories";

type DoseStatus = "taken" | "missed" | "skipped";

class DoseService {
  private async ensureReady(): Promise<void> {
    await bootstrapDatabase();
  }

  private extractDoseDate(timestamp: string): string {
    if (/^\d{4}-\d{2}-\d{2}/.test(timestamp)) {
      return timestamp.slice(0, 10);
    }

    return new Date().toISOString().slice(0, 10);
  }

  private async record(
    medicationId: string,
    taken: boolean,
    timestamp: string,
    scheduledTime?: string,
    status?: DoseStatus,
  ): Promise<void> {
    await this.ensureReady();
    const doseDate = this.extractDoseDate(timestamp);

    await dbManager.withTransaction(async () => {
      const existingScheduledDose = scheduledTime
        ? await doseHistoryRepository.findByMedicationDateTime(
            medicationId,
            doseDate,
            scheduledTime,
          )
        : null;

      const resolvedStatus: DoseStatus =
        status ??
        (taken
          ? "taken"
          : existingScheduledDose?.status === "skipped"
            ? "skipped"
            : "missed");

      await doseHistoryRepository.logDose({
        medicationId,
        taken,
        timestamp,
        scheduledTime,
        status: resolvedStatus,
      });

      const shouldDecrementSupply =
        taken && (scheduledTime ? !existingScheduledDose?.taken : true);

      if (!shouldDecrementSupply) {
        return;
      }

      const medication = await medicationRepository.findById(medicationId);
      if (!medication || medication.currentSupply <= 0) {
        return;
      }

      await medicationRepository.decrementSupply(medicationId, 1);
    });
  }

  async recordScheduledDose(
    medicationId: string,
    scheduledTime: string,
    timestamp = new Date().toISOString(),
  ): Promise<void> {
    await this.record(medicationId, true, timestamp, scheduledTime);
  }

  async recordAsNeededDose(
    medicationId: string,
    timestamp = new Date().toISOString(),
  ): Promise<void> {
    await this.record(medicationId, true, timestamp);
  }

  async skipScheduledDose(
    medicationId: string,
    scheduledTime: string,
    timestamp = new Date().toISOString(),
  ): Promise<void> {
    await this.record(medicationId, false, timestamp, scheduledTime, "skipped");
  }

  async skipAsNeededDose(
    medicationId: string,
    timestamp = new Date().toISOString(),
  ): Promise<void> {
    await this.record(medicationId, false, timestamp, undefined, "skipped");
  }
}

export const doseService = new DoseService();
