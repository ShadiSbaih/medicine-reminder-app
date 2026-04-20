import { bootstrapDatabase } from "@/database";
import { medicationRepository } from "@/database/repositories";
import { notificationOrchestrator } from "@/services/notification-orchestrator";
import type { Medication } from "@/utils/storage";

const MEDICATION_COLORS = [
  "#2DB19A",
  "#1B9F88",
  "#0F7267",
  "#177C71",
  "#2A9B82",
];

function createMedicationId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function pickMedicationColor(): string {
  const randomColor =
    MEDICATION_COLORS[Math.floor(Math.random() * MEDICATION_COLORS.length)];
  return randomColor ?? MEDICATION_COLORS[0] ?? "#2DB19A";
}

class MedicationService {
  private async ensureReady(): Promise<void> {
    await bootstrapDatabase();
  }

  async list(): Promise<Medication[]> {
    await this.ensureReady();
    return medicationRepository.findAll();
  }

  async getById(medicationId: string): Promise<Medication | null> {
    await this.ensureReady();
    return medicationRepository.findById(medicationId);
  }

  async create(
    input: Omit<Medication, "id" | "color"> & { id?: string; color?: string },
  ): Promise<Medication> {
    await this.ensureReady();

    const medication: Medication = {
      ...input,
      id: input.id ?? createMedicationId(),
      color: input.color ?? pickMedicationColor(),
    };

    await medicationRepository.create(medication);
    await notificationOrchestrator.onMedicationCreated(medication);
    return medication;
  }

  async update(medication: Medication): Promise<Medication> {
    await this.ensureReady();
    await medicationRepository.update(medication);
    await notificationOrchestrator.onMedicationUpdated(medication);
    return medication;
  }

  async remove(medicationId: string): Promise<void> {
    await this.ensureReady();
    await notificationOrchestrator.onMedicationDeleted(medicationId);
    await medicationRepository.softDelete(medicationId);
  }
}

export const medicationService = new MedicationService();
