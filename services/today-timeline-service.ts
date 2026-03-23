import {
    buildTimelineForDate,
    TimelineDose,
} from "@/shared/utils/dose-timeline";
import {
    DoseHistory,
    getDoseHistory,
    getMedications,
    getTodaysDoses,
} from "@/utils/storage";

export interface TimelineViewModel {
  items: TimelineDose[];
  totalScheduled: number;
  completedScheduled: number;
  overdueCount: number;
  pendingScheduled: TimelineDose[];
  nextDueDose?: TimelineDose;
  progress: number;
}

export interface NotificationTimelineItem extends TimelineDose {
  isRead: boolean;
}

export interface NotificationTimelineViewModel {
  items: NotificationTimelineItem[];
  unreadCount: number;
  unreadIds: string[];
}

function timeToDate(baseDate: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function buildViewModel(
  items: TimelineDose[],
  totalScheduled: number,
  completedScheduled: number,
  overdueCount: number,
  referenceDate: Date,
): TimelineViewModel {
  const now = new Date();
  const pendingScheduled = items.filter(
    (dose) => Boolean(dose.scheduledTime) && !dose.isResolved,
  );

  const nextUpcomingDose = pendingScheduled.find(
    (dose) =>
      dose.scheduledTime &&
      timeToDate(referenceDate, dose.scheduledTime).getTime() >= now.getTime(),
  );

  const nextDueDose = nextUpcomingDose ?? pendingScheduled[0];
  const progress = totalScheduled > 0 ? completedScheduled / totalScheduled : 0;

  return {
    items,
    totalScheduled,
    completedScheduled,
    overdueCount,
    pendingScheduled,
    nextDueDose,
    progress,
  };
}

class TodayTimelineService {
  async getForToday(): Promise<TimelineViewModel> {
    const [medications, todaysDoses] = await Promise.all([
      getMedications(),
      getTodaysDoses(),
    ]);

    const timeline = buildTimelineForDate(medications, todaysDoses, new Date());

    return buildViewModel(
      timeline.items,
      timeline.totalScheduled,
      timeline.completedScheduled,
      timeline.overdueCount,
      new Date(),
    );
  }

  async getForDate(date: Date): Promise<TimelineViewModel> {
    const [medications, allDoses] = await Promise.all([
      getMedications(),
      getDoseHistory(),
    ]);

    const timeline = buildTimelineForDate(
      medications,
      allDoses,
      date,
      new Date(),
    );

    return buildViewModel(
      timeline.items,
      timeline.totalScheduled,
      timeline.completedScheduled,
      timeline.overdueCount,
      date,
    );
  }

  getNotificationReadState(items: TimelineDose[], readIds: string[]) {
    return items.map((dose) => ({
      ...dose,
      isRead:
        !dose.scheduledTime || dose.isResolved || readIds.includes(dose.id),
    }));
  }

  groupByMedication(items: TimelineDose[]) {
    const groups = new Map<
      string,
      { medication: TimelineDose["medication"]; items: TimelineDose[] }
    >();

    items.forEach((item) => {
      const existing = groups.get(item.medication.id);
      if (existing) {
        existing.items.push(item);
        return;
      }

      groups.set(item.medication.id, {
        medication: item.medication,
        items: [item],
      });
    });

    return Array.from(groups.values());
  }

  getNotificationViewModel(
    items: TimelineDose[],
    readIds: string[],
  ): NotificationTimelineViewModel {
    const notificationItems = this.getNotificationReadState(items, readIds);
    const unreadIds = notificationItems
      .filter((item) => !item.isRead && Boolean(item.scheduledTime))
      .map((item) => item.id);

    return {
      items: notificationItems,
      unreadCount: unreadIds.length,
      unreadIds,
    };
  }

  filterHistoryByDate(doseHistory: DoseHistory[], date: Date) {
    const dayKey = date.toDateString();
    return doseHistory.filter(
      (dose) => new Date(dose.timestamp).toDateString() === dayKey,
    );
  }
}

export const todayTimelineService = new TodayTimelineService();
