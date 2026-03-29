import AsyncStorage from "@react-native-async-storage/async-storage";

const MEDICATIONS_KEY = "@medications";
const DOSE_HISTORY_KEY = "@dose_history";
const NOTIFICATION_READ_KEY = "@notification_read";
const STORAGE_SCHEMA_VERSION_KEY = "@storage_schema_version";
const CURRENT_STORAGE_SCHEMA_VERSION = 1;

type NotificationReadMap = Record<string, string[]>;

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
  status?: "taken" | "missed" | "skipped";
  scheduledTime?: string;
}

export function getDoseStatus(
  dose: DoseHistory,
): "taken" | "missed" | "skipped" {
  if (
    dose.status === "taken" ||
    dose.status === "missed" ||
    dose.status === "skipped"
  ) {
    return dose.status;
  }

  return dose.taken ? "taken" : "missed";
}

export async function runStorageMigrations(): Promise<void> {
  try {
    // Ensure AsyncStorage is ready
    await AsyncStorage.getItem("@ready_check");

    const versionRaw = await AsyncStorage.getItem(STORAGE_SCHEMA_VERSION_KEY);
    const version = versionRaw ? Number(versionRaw) : 0;

    if (version >= CURRENT_STORAGE_SCHEMA_VERSION) {
      return;
    }

    const doseHistory = await getDoseHistory();
    const normalized = doseHistory.map((dose) => ({
      ...dose,
      status: getDoseStatus(dose),
    }));

    await AsyncStorage.setItem(DOSE_HISTORY_KEY, JSON.stringify(normalized));
    await AsyncStorage.setItem(
      STORAGE_SCHEMA_VERSION_KEY,
      String(CURRENT_STORAGE_SCHEMA_VERSION),
    );
  } catch (error) {
    console.error("Error running storage migrations:", error);
    // Don't throw - let the app continue with default values
  }
}

export async function getMedications(): Promise<Medication[]> {
  try {
    const data = await AsyncStorage.getItem(MEDICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting medications:", error);
    return [];
  }
}

export async function addMedication(medication: Medication): Promise<void> {
  try {
    const medications = await getMedications();
    medications.push(medication);
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
  } catch (error) {
    console.error("Error adding medication:", error);
    throw error;
  }
}

export async function updateMedication(
  updatedMedication: Medication,
): Promise<void> {
  try {
    const medications = await getMedications();
    const index = medications.findIndex(
      (med) => med.id === updatedMedication.id,
    );
    if (index !== -1) {
      medications[index] = updatedMedication;
      await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
    }
  } catch (error) {
    console.error("Error updating medication:", error);
    throw error;
  }
}

export async function deleteMedication(id: string): Promise<void> {
  try {
    const medications = await getMedications();
    const updatedMedications = medications.filter((med) => med.id !== id);
    await AsyncStorage.setItem(
      MEDICATIONS_KEY,
      JSON.stringify(updatedMedications),
    );
  } catch (error) {
    console.error("Error deleting medication:", error);
    throw error;
  }
}

export async function getDoseHistory(): Promise<DoseHistory[]> {
  try {
    const data = await AsyncStorage.getItem(DOSE_HISTORY_KEY);
    const parsed: DoseHistory[] = data ? JSON.parse(data) : [];

    return parsed.map((dose) => ({
      ...dose,
      status: getDoseStatus(dose),
    }));
  } catch (error) {
    console.error("Error getting dose history:", error);
    return [];
  }
}

export async function getTodaysDoses(): Promise<DoseHistory[]> {
  try {
    const history = await getDoseHistory();
    const today = new Date().toDateString();
    return history.filter(
      (dose) => new Date(dose.timestamp).toDateString() === today,
    );
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
  status?: "taken" | "missed" | "skipped",
): Promise<void> {
  try {
    const history = await getDoseHistory();
    let shouldDecrementSupply = false;

    // For scheduled doses, keep only one record per medication + time per day.
    if (scheduledTime) {
      const targetDate = new Date(timestamp).toDateString();
      const existingIndex = history.findIndex(
        (dose) =>
          dose.medicationId === medicationId &&
          dose.scheduledTime === scheduledTime &&
          new Date(dose.timestamp).toDateString() === targetDate,
      );

      if (existingIndex >= 0) {
        const previous = history[existingIndex];
        const resolvedStatus =
          status ??
          (taken
            ? "taken"
            : previous.status === "skipped"
              ? "skipped"
              : "missed");
        history[existingIndex] = {
          ...previous,
          timestamp,
          taken,
          status: resolvedStatus,
        };
        shouldDecrementSupply = taken && !previous.taken;
      } else {
        const resolvedStatus = status ?? (taken ? "taken" : "missed");
        const newDose: DoseHistory = {
          id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`,
          medicationId,
          timestamp,
          taken,
          status: resolvedStatus,
          scheduledTime,
        };
        history.push(newDose);
        shouldDecrementSupply = taken;
      }
    } else {
      const resolvedStatus = status ?? (taken ? "taken" : "missed");
      const newDose: DoseHistory = {
        id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`,
        medicationId,
        timestamp,
        taken,
        status: resolvedStatus,
        scheduledTime,
      };
      history.push(newDose);
      shouldDecrementSupply = taken;
    }

    await AsyncStorage.setItem(DOSE_HISTORY_KEY, JSON.stringify(history));

    // Update medication supply if taken
    if (shouldDecrementSupply) {
      const medications = await getMedications();
      const medication = medications.find((med) => med.id === medicationId);
      if (medication && medication.currentSupply > 0) {
        medication.currentSupply -= 1;
        await updateMedication(medication);
      }
    }
  } catch (error) {
    console.error("Error recording dose:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      MEDICATIONS_KEY,
      DOSE_HISTORY_KEY,
      NOTIFICATION_READ_KEY,
    ]);
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}

async function getNotificationReadMap(): Promise<NotificationReadMap> {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATION_READ_KEY);
    return data ? JSON.parse(data) : {};
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
