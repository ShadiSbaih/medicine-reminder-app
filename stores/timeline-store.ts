import {
    todayTimelineService,
    type TimelineViewModel,
} from "@/services/today-timeline-service";
import type { TimelineDose } from "@/shared/utils/dose-timeline";
import { create } from "zustand";

interface TimelineStoreState {
  items: TimelineDose[];
  totalScheduled: number;
  completedScheduled: number;
  overdueCount: number;
  progress: number;
  nextDueDose?: TimelineDose;
  isLoading: boolean;
  error: string | null;
  currentDate: string;
  loadToday: () => Promise<void>;
  loadForDate: (date: Date) => Promise<void>;
  clearError: () => void;
}

function applyViewModel(viewModel: TimelineViewModel) {
  return {
    items: viewModel.items,
    totalScheduled: viewModel.totalScheduled,
    completedScheduled: viewModel.completedScheduled,
    overdueCount: viewModel.overdueCount,
    progress: viewModel.progress,
    nextDueDose: viewModel.nextDueDose,
  };
}

export const useTimelineStore = create<TimelineStoreState>((set) => ({
  items: [],
  totalScheduled: 0,
  completedScheduled: 0,
  overdueCount: 0,
  progress: 0,
  nextDueDose: undefined,
  isLoading: false,
  error: null,
  currentDate: new Date().toISOString().slice(0, 10),

  loadToday: async () => {
    set({ isLoading: true, error: null });
    try {
      const timeline = await todayTimelineService.getForToday();
      set({
        ...applyViewModel(timeline),
        isLoading: false,
        currentDate: new Date().toISOString().slice(0, 10),
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to load timeline",
      });
      throw error;
    }
  },

  loadForDate: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const timeline = await todayTimelineService.getForDate(date);
      set({
        ...applyViewModel(timeline),
        isLoading: false,
        currentDate: date.toISOString().slice(0, 10),
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to load timeline",
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
