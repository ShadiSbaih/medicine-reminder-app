export interface MedicationScheduleWindow {
  startDate: string;
  duration: string;
}

export function parseDurationDays(duration: string): number {
  const normalized = duration.trim().toLowerCase();
  if (normalized.includes("ongoing")) {
    return -1;
  }

  const match = normalized.match(/-?\d+/);
  if (!match) {
    return -1;
  }

  const value = Number(match[0]);
  return Number.isFinite(value) ? value : -1;
}

export function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function isMedicationActiveOnDate(
  medication: MedicationScheduleWindow,
  date: Date,
): boolean {
  const startDate = startOfDay(new Date(medication.startDate));
  const targetDate = startOfDay(date);
  const durationDays = parseDurationDays(medication.duration);

  if (targetDate < startDate) {
    return false;
  }

  if (durationDays === -1) {
    return true;
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.max(durationDays - 1, 0));
  return targetDate <= endDate;
}
