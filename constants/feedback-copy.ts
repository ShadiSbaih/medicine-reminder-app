export type DoseActionType = "take" | "skip";

const actionLabel: Record<DoseActionType, string> = {
  take: "taken",
  skip: "skipped",
};

export function getDoseSuccessMessage(
  action: DoseActionType,
  medicationName: string,
) {
  return `Saved. ${medicationName} marked as ${actionLabel[action]}.`;
}

export function getDoseFailureAlert(action: DoseActionType) {
  const actionText =
    action === "take" ? "mark this dose as taken" : "skip this dose";
  return {
    title: "Something went wrong",
    message: `We could not ${actionText}. Please try again.`,
  };
}

export function getSkipConfirmationCopy(
  medicationName: string,
  scheduledTime?: string,
) {
  const timeSuffix = scheduledTime ? ` at ${scheduledTime}` : "";

  return {
    title: "Skip this dose?",
    message: `Mark ${medicationName}${timeSuffix} as skipped for now?`,
    confirmLabel: "Skip",
    cancelLabel: "Cancel",
  };
}

export function getEditOpenMessage(medicationName: string) {
  return `Opening edit form for ${medicationName}...`;
}

export function getEntityNotFoundAlert(entityName: string) {
  return {
    title: "Not found",
    message: `${entityName} could not be found.`,
  };
}

export function getSaveSuccessAlert(isEditMode: boolean) {
  return {
    title: "Saved",
    message: isEditMode
      ? "Medication updated successfully."
      : "Medication added successfully.",
  };
}

export function getSaveFailureAlert() {
  return {
    title: "Something went wrong",
    message: "We could not save this medication. Please try again.",
  };
}

export function getDeleteConfirmationAlert() {
  return {
    title: "Delete this medication?",
    message: "This action cannot be undone.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
  };
}

export function getDeleteSuccessAlert() {
  return {
    title: "Deleted",
    message: "Medication deleted successfully.",
  };
}

export function getDeleteFailureAlert() {
  return {
    title: "Something went wrong",
    message: "We could not delete this medication. Please try again.",
  };
}

export function getClearAllConfirmationAlert() {
  return {
    title: "Clear all data?",
    message:
      "This removes all medications and history from this device and cannot be undone.",
    confirmLabel: "Clear All",
    cancelLabel: "Cancel",
  };
}

export function getClearAllSuccessAlert() {
  return {
    title: "Cleared",
    message: "All medication data was removed successfully.",
  };
}

export function getClearAllFailureAlert() {
  return {
    title: "Something went wrong",
    message: "We could not clear your data. Please try again.",
  };
}
