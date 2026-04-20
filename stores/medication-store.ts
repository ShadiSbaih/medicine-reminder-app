import { medicationService } from "@/services/medication-service";
import type { Medication } from "@/utils/storage";
import { create } from "zustand";

export type MedicationEntity = Medication;

export type MedicationCreateInput = Omit<Medication, "id" | "color"> & {
  id?: string;
  color?: string;
};

interface MedicationStoreState {
  medications: Medication[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  loadMedications: () => Promise<void>;
  addMedication: (input: MedicationCreateInput) => Promise<Medication>;
  updateMedication: (medication: Medication) => Promise<Medication>;
  removeMedication: (medicationId: string) => Promise<void>;
  clearError: () => void;
}

export const useMedicationStore = create<MedicationStoreState>((set) => ({
  medications: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  loadMedications: async () => {
    set({ isLoading: true, error: null });
    try {
      const medications = await medicationService.list();
      set({
        medications,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to load medications",
      });
      throw error;
    }
  },

  addMedication: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const medication = await medicationService.create(input);
      set((state) => ({
        medications: [...state.medications, medication],
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      }));
      return medication;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to add medication",
      });
      throw error;
    }
  },

  updateMedication: async (medication) => {
    set({ error: null });
    try {
      const updated = await medicationService.update(medication);
      set((state) => ({
        medications: state.medications.map((item) =>
          item.id === updated.id ? updated : item,
        ),
        lastUpdated: new Date().toISOString(),
      }));
      return updated;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update medication",
      });
      throw error;
    }
  },

  removeMedication: async (medicationId) => {
    set({ error: null });
    try {
      await medicationService.remove(medicationId);
      set((state) => ({
        medications: state.medications.filter(
          (item) => item.id !== medicationId,
        ),
        lastUpdated: new Date().toISOString(),
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove medication",
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
