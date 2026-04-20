import type { DoseHistory, Medication } from "@/utils/storage";
import { clearAllData, getDoseHistory, getMedications } from "@/utils/storage";
import { create } from "zustand";

export type EnrichedDoseHistory = DoseHistory & {
  medication?: Medication;
};

interface HistoryStoreState {
  records: EnrichedDoseHistory[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  clearError: () => void;
}

export const useHistoryStore = create<HistoryStoreState>((set) => ({
  records: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  loadHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const [doseHistory, medications] = await Promise.all([
        getDoseHistory(),
        getMedications(),
      ]);

      const records = doseHistory.map((dose) => ({
        ...dose,
        medication: medications.find(
          (medication) => medication.id === dose.medicationId,
        ),
      }));

      set({
        records,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to load history",
      });
      throw error;
    }
  },

  clearHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      await clearAllData();
      set({
        records: [],
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to clear history",
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
