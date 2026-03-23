import { notificationOrchestrator } from "@/services/notification-orchestrator";
import {
    addMedication,
    deleteMedication,
    getMedications,
    Medication,
    updateMedication,
} from "@/utils/storage";

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
  return MEDICATION_COLORS[
    Math.floor(Math.random() * MEDICATION_COLORS.length)
  ];
}

class MedicationService {
  async list(): Promise<Medication[]> {
    return getMedications();
  }

  async getById(medicationId: string): Promise<Medication | null> {
    const medications = await getMedications();
    return (
      medications.find((medication) => medication.id === medicationId) ?? null
    );
  }

  async create(
    input: Omit<Medication, "id" | "color"> & { id?: string; color?: string },
  ): Promise<Medication> {
    const medication: Medication = {
      ...input,
      id: input.id ?? createMedicationId(),
      color: input.color ?? pickMedicationColor(),
    };

    await addMedication(medication);
    await notificationOrchestrator.onMedicationCreated(medication);
    return medication;
  }

  async update(medication: Medication): Promise<Medication> {
    await updateMedication(medication);
    await notificationOrchestrator.onMedicationUpdated(medication);
    return medication;
  }

  async remove(medicationId: string): Promise<void> {
    await notificationOrchestrator.onMedicationDeleted(medicationId);
    await deleteMedication(medicationId);
  }
}

export const medicationService = new MedicationService();
