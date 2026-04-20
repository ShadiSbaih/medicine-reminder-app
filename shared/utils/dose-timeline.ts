import { isMedicationActiveOnDate } from "@/shared/utils/medication-schedule";
import { DoseHistory, Medication, getDoseStatus } from "@/utils/storage";

export interface TimelineDose {
  id: string;
  medication: Medication;
  scheduledTime?: string;
  timeLabel: string;
  taken: boolean;
  status: "taken" | "missed" | "skipped";
  isResolved: boolean;
  isOverdue: boolean;
}

export interface TimelineResult {
  items: TimelineDose[];
  totalScheduled: number;
  completedScheduled: number;
  overdueCount: number;
}

function toDayKey(date: Date | string): string {
  return new Date(date).toDateString();
}

function getDoseStatusOnDate(
  doseHistory: DoseHistory[],
  medicationId: string,
  date: Date,
  scheduledTime?: string,
): "taken" | "missed" | "skipped" | undefined {
  const dayKey = toDayKey(date);

  if (scheduledTime) {
    const match = doseHistory.find(
      (dose) =>
        dose.medicationId === medicationId &&
        dose.scheduledTime === scheduledTime &&
        toDayKey(dose.timestamp) === dayKey,
    );

    return match ? getDoseStatus(match) : undefined;
  }

  const match = doseHistory.find(
    (dose) =>
      dose.medicationId === medicationId &&
      !dose.scheduledTime &&
      toDayKey(dose.timestamp) === dayKey,
  );

  return match ? getDoseStatus(match) : undefined;
}

function timeToDate(baseDate: Date, time: string): Date {
  const [hourText = "0", minuteText = "0"] = time.split(":");
  const parsedHours = Number(hourText);
  const parsedMinutes = Number(minuteText);
  const hours = Number.isFinite(parsedHours) ? parsedHours : 0;
  const minutes = Number.isFinite(parsedMinutes) ? parsedMinutes : 0;
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function buildDoseTimestamp(date: Date, scheduledTime?: string): string {
  const value = new Date(date);

  if (scheduledTime) {
    const [hourText = "0", minuteText = "0"] = scheduledTime.split(":");
    const parsedHours = Number(hourText);
    const parsedMinutes = Number(minuteText);
    const hours = Number.isFinite(parsedHours) ? parsedHours : 0;
    const minutes = Number.isFinite(parsedMinutes) ? parsedMinutes : 0;
    value.setHours(hours, minutes, 0, 0);
    return value.toISOString();
  }

  const now = new Date();
  value.setHours(now.getHours(), now.getMinutes(), 0, 0);
  return value.toISOString();
}

export function buildTimelineForDate(
  medications: Medication[],
  doseHistory: DoseHistory[],
  date: Date,
  now = new Date(),
): TimelineResult {
  const activeMedications = medications.filter((medication) =>
    isMedicationActiveOnDate(medication, date),
  );

  const items: TimelineDose[] = [];

  activeMedications.forEach((medication) => {
    if (medication.times.length === 0) {
      const status = getDoseStatusOnDate(doseHistory, medication.id, date);
      const taken = status === "taken";
      items.push({
        id: `${medication.id}-as-needed`,
        medication,
        timeLabel: "As needed",
        taken,
        status: status ?? "missed",
        isResolved: Boolean(status),
        isOverdue: false,
      });
      return;
    }

    medication.times.forEach((time) => {
      const status = getDoseStatusOnDate(
        doseHistory,
        medication.id,
        date,
        time,
      );
      const taken = status === "taken";
      const isResolved = Boolean(status);
      const isOverdue =
        !isResolved && timeToDate(date, time).getTime() < now.getTime();
      items.push({
        id: `${medication.id}-${time}`,
        medication,
        scheduledTime: time,
        timeLabel: time,
        taken,
        status: status ?? "missed",
        isResolved,
        isOverdue,
      });
    });
  });

  const sorted = [...items].sort((a, b) => {
    if (!a.scheduledTime && !b.scheduledTime) return 0;
    if (!a.scheduledTime) return 1;
    if (!b.scheduledTime) return -1;

    return (
      timeToDate(date, a.scheduledTime).getTime() -
      timeToDate(date, b.scheduledTime).getTime()
    );
  });

  const scheduledItems = sorted.filter((item) => Boolean(item.scheduledTime));
  const completedScheduled = scheduledItems.filter((item) => item.taken).length;
  const overdueCount = scheduledItems.filter((item) => item.isOverdue).length;

  return {
    items: sorted,
    totalScheduled: scheduledItems.length,
    completedScheduled,
    overdueCount,
  };
}
