import { bootstrapDatabase, dbManager } from "@/database";
import {
    doseHistoryRepository,
    medicationRepository,
} from "@/database/repositories";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LEGACY_MEDICATIONS_KEY = "@medications";
const LEGACY_DOSE_HISTORY_KEY = "@dose_history";
const NOTIFICATION_READ_KEY = "@notification_read";

type NotificationReadMap = Record<string, string[]>;

type DoseStatus = "taken" | "missed" | "skipped";

let bootstrapPromise: Promise<void> | null = null;

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  duration: string;
  notes?: string;
  color: string;
  reminderEnabled: boolean;
  currentSupply: number;
  totalSupply: number;
  refillAt: number;
  refillReminder: boolean;
  lastRefillDate?: string;
}

export interface DoseHistory {
  id: string;
  medicationId: string;
  timestamp: string;
  taken: boolean;
  status?: DoseStatus;
  scheduledTime?: string;
}

export function getDoseStatus(dose: DoseHistory): DoseStatus {
  if (
    dose.status === "taken" ||
    dose.status === "missed" ||
    dose.status === "skipped"
  ) {
    return dose.status;
  }

  return dose.taken ? "taken" : "missed";
}

async function ensureDatabaseReady(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapDatabase().then(() => undefined);
  }

  await bootstrapPromise;
}

function extractDoseDate(timestamp: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(timestamp)) {
    return timestamp.slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

export async function runStorageMigrations(): Promise<void> {
  try {
    await ensureDatabaseReady();
  } catch (error) {
    console.error("Error running storage migrations:", error);
  }
}

export async function getMedications(): Promise<Medication[]> {
  try {
    await ensureDatabaseReady();
    return medicationRepository.findAll();
  } catch (error) {
    console.error("Error getting medications:", error);
    return [];
  }
}

export async function addMedication(medication: Medication): Promise<void> {
  try {
    await ensureDatabaseReady();
    await medicationRepository.create(medication);
  } catch (error) {
    console.error("Error adding medication:", error);
    throw error;
  }
}

export async function updateMedication(
  updatedMedication: Medication,
): Promise<void> {
  try {
    await ensureDatabaseReady();
    await medicationRepository.update(updatedMedication);
  } catch (error) {
    console.error("Error updating medication:", error);
    throw error;
  }
}

export async function deleteMedication(id: string): Promise<void> {
  try {
    await ensureDatabaseReady();
    await medicationRepository.softDelete(id);
  } catch (error) {
    console.error("Error deleting medication:", error);
    throw error;
  }
}

export async function getDoseHistory(): Promise<DoseHistory[]> {
  try {
    await ensureDatabaseReady();
    return doseHistoryRepository.listAll();
  } catch (error) {
    console.error("Error getting dose history:", error);
    return [];
  }
}

export async function getTodaysDoses(): Promise<DoseHistory[]> {
  try {
    await ensureDatabaseReady();
    return doseHistoryRepository.listToday();
  } catch (error) {
    console.error("Error getting today's doses:", error);
    return [];
  }
}

export async function recordDose(
  medicationId: string,
  taken: boolean,
  timestamp: string,
  scheduledTime?: string,
  status?: DoseStatus,
): Promise<void> {
  try {
    await ensureDatabaseReady();
    const doseDate = extractDoseDate(timestamp);

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
  } catch (error) {
    console.error("Error recording dose:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await ensureDatabaseReady();
    const db = dbManager.getSQLite();

    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM dose_history`);
      await db.runAsync(`DELETE FROM medications`);
      await db.runAsync(`DELETE FROM notification_events`);
    });

    await Promise.all([
      AsyncStorage.removeItem(LEGACY_MEDICATIONS_KEY),
      AsyncStorage.removeItem(LEGACY_DOSE_HISTORY_KEY),
      AsyncStorage.removeItem(NOTIFICATION_READ_KEY),
    ]);
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}

async function getNotificationReadMap(): Promise<NotificationReadMap> {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATION_READ_KEY);
    return data ? (JSON.parse(data) as NotificationReadMap) : {};
  } catch (error) {
    console.error("Error getting notification read map:", error);
    return {};
  }
}

export async function getReadNotificationIds(
  dateKey: string,
): Promise<string[]> {
  const map = await getNotificationReadMap();
  return map[dateKey] ?? [];
}

export async function markNotificationAsRead(
  dateKey: string,
  notificationId: string,
): Promise<void> {
  try {
    const map = await getNotificationReadMap();
    const existing = new Set(map[dateKey] ?? []);
    existing.add(notificationId);
    map[dateKey] = Array.from(existing);
    await AsyncStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(map));
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

export async function markNotificationsAsRead(
  dateKey: string,
  notificationIds: string[],
): Promise<void> {
  try {
    const map = await getNotificationReadMap();
    const existing = new Set(map[dateKey] ?? []);
    notificationIds.forEach((id) => existing.add(id));
    map[dateKey] = Array.from(existing);
    await AsyncStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(map));
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
}
