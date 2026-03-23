import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Medication } from "./storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensureNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) {
    return null;
  }

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1a8e2d",
      });
    }
    return "local-notifications-enabled";
  } catch (error) {
    console.error("Error initializing notifications:", error);
    return null;
  }
}

export async function scheduleMedicationReminder(
  medication: Medication,
): Promise<string | undefined> {
  if (!medication.reminderEnabled || medication.times.length === 0) return;

  try {
    const hasPermission = await ensureNotificationPermissions();
    if (!hasPermission) return;

    let latestIdentifier: string | undefined;
    for (const time of medication.times) {
      const [hours, minutes] = time.split(":").map(Number);
      if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        continue;
      }

      latestIdentifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Medication Reminder",
          body: `Time to take ${medication.name} (${medication.dosage})`,
          data: { medicationId: medication.id, scheduledTime: time },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });
    }
    return latestIdentifier;
  } catch (error) {
    console.error("Error scheduling medication reminder:", error);
    return undefined;
  }
}

export async function scheduleRefillReminder(
  medication: Medication,
): Promise<string | undefined> {
  if (!medication.refillReminder) return;

  try {
    const hasPermission = await ensureNotificationPermissions();
    if (!hasPermission) return;

    // Schedule a notification when supply is low
    if (medication.currentSupply <= medication.refillAt) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Refill Reminder",
          body: `Your ${medication.name} supply is running low. Current supply: ${medication.currentSupply}`,
          data: { medicationId: medication.id, type: "refill" },
        },
        trigger: null,
      });

      return identifier;
    }
  } catch (error) {
    console.error("Error scheduling refill reminder:", error);
    return undefined;
  }
}

export async function cancelMedicationReminders(
  medicationId: string,
): Promise<void> {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      const data = notification.content.data as {
        medicationId?: string;
      } | null;
      if (data?.medicationId === medicationId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier,
        );
      }
    }
  } catch (error) {
    console.error("Error canceling medication reminders:", error);
  }
}

export async function updateMedicationReminders(
  medication: Medication,
): Promise<void> {
  try {
    const initialized = await registerForPushNotificationsAsync();
    if (!initialized) return;

    // Cancel existing reminders
    await cancelMedicationReminders(medication.id);

    // Schedule new reminders
    await scheduleMedicationReminder(medication);
    await scheduleRefillReminder(medication);
  } catch (error) {
    console.error("Error updating medication reminders:", error);
  }
}

export async function sendMedicationAddedNotification(
  medication: Medication,
): Promise<string | undefined> {
  try {
    const initialized = await registerForPushNotificationsAsync();
    if (!initialized) return;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Medication Added",
        body: `${medication.name} (${medication.dosage}) was added successfully.`,
        data: { medicationId: medication.id, type: "medication-added" },
      },
      trigger: null,
    });
  } catch (error) {
    console.error("Error sending medication added notification:", error);
    return undefined;
  }
}
