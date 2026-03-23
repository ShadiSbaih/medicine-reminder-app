import { recordDose } from "@/utils/storage";

class DoseService {
  async recordScheduledDose(
    medicationId: string,
    scheduledTime: string,
    timestamp = new Date().toISOString(),
  ): Promise<void> {
    await recordDose(medicationId, true, timestamp, scheduledTime);
  }

  async recordAsNeededDose(
    medicationId: string,
    timestamp = new Date().toISOString(),
  ): Promise<void> {
    await recordDose(medicationId, true, timestamp);
  }

  async skipScheduledDose(
    medicationId: string,
    scheduledTime: string,
    timestamp = new Date().toISOString(),
  ): Promise<void> {
    await recordDose(medicationId, false, timestamp, scheduledTime, "skipped");
  }

  async skipAsNeededDose(
    medicationId: string,
    timestamp = new Date().toISOString(),
  ): Promise<void> {
    await recordDose(medicationId, false, timestamp, undefined, "skipped");
  }
}

export const doseService = new DoseService();
