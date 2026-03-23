import {
    cancelMedicationReminders,
    sendMedicationAddedNotification,
    updateMedicationReminders,
} from "@/utils/notifications";
import { Medication } from "@/utils/storage";

class NotificationOrchestrator {
  async onMedicationCreated(medication: Medication): Promise<void> {
    await sendMedicationAddedNotification(medication);
    if (medication.reminderEnabled || medication.refillReminder) {
      await updateMedicationReminders(medication);
    }
  }

  async onMedicationUpdated(medication: Medication): Promise<void> {
    if (medication.reminderEnabled || medication.refillReminder) {
      await updateMedicationReminders(medication);
      return;
    }

    await cancelMedicationReminders(medication.id);
  }

  async onMedicationDeleted(medicationId: string): Promise<void> {
    await cancelMedicationReminders(medicationId);
  }
}

export const notificationOrchestrator = new NotificationOrchestrator();
