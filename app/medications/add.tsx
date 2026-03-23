import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SkeuoTheme } from "../../constants/theme";
import {
  cancelMedicationReminders,
  updateMedicationReminders,
} from "../../utils/notifications";
import {
  addMedication,
  deleteMedication,
  getMedications,
  updateMedication,
} from "../../utils/storage";

const { width } = Dimensions.get("window");

const FREQUENCIES = [
  {
    id: "1",
    label: "Once daily",
    icon: "sunny-outline" as const,
    times: ["09:00"],
  },
  {
    id: "2",
    label: "Twice daily",
    icon: "sync-outline" as const,
    times: ["09:00", "21:00"],
  },
  {
    id: "3",
    label: "Three times daily",
    icon: "time-outline" as const,
    times: ["09:00", "15:00", "21:00"],
  },
  {
    id: "4",
    label: "Four times daily",
    icon: "repeat-outline" as const,
    times: ["09:00", "13:00", "17:00", "21:00"],
  },
  { id: "5", label: "As needed", icon: "calendar-outline" as const, times: [] },
];

const DURATIONS = [
  { id: "1", label: "7 days", value: 7 },
  { id: "2", label: "14 days", value: 14 },
  { id: "3", label: "30 days", value: 30 },
  { id: "4", label: "90 days", value: 90 },
  { id: "5", label: "Ongoing", value: -1 },
];

export default function AddMedicationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { medicationId } = useLocalSearchParams<{ medicationId?: string }>();
  const isEditMode = Boolean(medicationId);
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    startDate: new Date(),
    times: ["09:00"],
    notes: "",
    reminderEnabled: true,
    refillReminder: false,
    currentSupply: "",
    refillAt: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [loadedMedicationColor, setLoadedMedicationColor] = useState("#2DB19A");
  const [loadedTotalSupply, setLoadedTotalSupply] = useState(0);

  useEffect(() => {
    if (!isEditMode || !medicationId) return;

    const loadMedicationForEdit = async () => {
      const medications = await getMedications();
      const existing = medications.find((med) => med.id === medicationId);
      if (!existing) {
        Alert.alert("Not found", "Medication was not found.", [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }

      setLoadedMedicationColor(existing.color || "#2DB19A");
      setLoadedTotalSupply(existing.totalSupply || existing.currentSupply || 0);
      setForm({
        name: existing.name,
        dosage: existing.dosage,
        frequency: existing.frequency,
        duration: existing.duration,
        startDate: new Date(existing.startDate),
        times: existing.times?.length ? existing.times : ["09:00"],
        notes: existing.notes || "",
        reminderEnabled: existing.reminderEnabled,
        refillReminder: existing.refillReminder,
        currentSupply:
          typeof existing.currentSupply === "number"
            ? String(existing.currentSupply)
            : "",
        refillAt:
          typeof existing.refillAt === "number"
            ? String(existing.refillAt)
            : "",
      });
      setSelectedFrequency(existing.frequency || "");
      setSelectedDuration(existing.duration || "");
    };

    loadMedicationForEdit();
  }, [isEditMode, medicationId, router]);

  const buildValidationIssues = (newErrors: { [key: string]: string }) => {
    const entries = Object.entries(newErrors);
    if (entries.length === 0) return [];
    return entries.map(([, value]) => value);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.name.trim()) {
      newErrors.name = "Medication name is required";
    }

    if (!form.dosage.trim()) {
      newErrors.dosage = "Dosage is required";
    }

    if (!form.frequency) {
      newErrors.frequency = "Frequency is required";
    }

    if (!form.duration) {
      newErrors.duration = "Duration is required";
    }

    if (form.refillReminder) {
      if (!form.currentSupply) {
        newErrors.currentSupply =
          "Current supply is required for refill tracking";
      }
      if (!form.refillAt) {
        newErrors.refillAt = "Refill alert threshold is required";
      }
      if (Number(form.currentSupply) <= 0) {
        newErrors.currentSupply = "Current supply must be greater than zero";
      }
      if (Number(form.refillAt) < 0) {
        newErrors.refillAt = "Refill alert must be zero or greater";
      }
      if (
        Number(form.currentSupply) > 0 &&
        Number(form.refillAt) >= Number(form.currentSupply)
      ) {
        newErrors.refillAt = "Refill alert must be less than current supply";
      }
    }

    setErrors(newErrors);
    const issues = buildValidationIssues(newErrors);
    setValidationIssues(issues);
    setShowValidationModal(issues.length > 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      if (isSubmitting) return;
      setIsSubmitting(true);

      // Generate a random color
      const colors = ["#2DB19A", "#1B9F88", "#0F7267", "#177C71", "#2A9B82"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const medicationData = {
        id:
          (isEditMode && medicationId) ||
          `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`,
        ...form,
        currentSupply: form.currentSupply ? Number(form.currentSupply) : 0,
        totalSupply: isEditMode
          ? Math.max(
              loadedTotalSupply,
              form.currentSupply ? Number(form.currentSupply) : 0,
            )
          : form.currentSupply
            ? Number(form.currentSupply)
            : 0,
        refillAt: form.refillAt ? Number(form.refillAt) : 0,
        startDate: form.startDate.toISOString(),
        color: isEditMode ? loadedMedicationColor : randomColor,
      };

      if (isEditMode) {
        await updateMedication(medicationData);
      } else {
        await addMedication(medicationData);
      }

      // Schedule reminders with deduplication safety
      if (medicationData.reminderEnabled || medicationData.refillReminder) {
        await updateMedicationReminders(medicationData);
      } else if (isEditMode) {
        await cancelMedicationReminders(medicationData.id);
      }

      Alert.alert(
        "Success",
        isEditMode
          ? "Medication updated successfully"
          : "Medication added successfully",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
        { cancelable: false },
      );
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert(
        "Error",
        "Failed to save medication. Please try again.",
        [{ text: "OK" }],
        { cancelable: false },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFrequencySelect = (freq: string) => {
    setSelectedFrequency(freq);
    const selectedFreq = FREQUENCIES.find((f) => f.label === freq);
    setForm((prev) => ({
      ...prev,
      frequency: freq,
      times: selectedFreq?.times || [],
    }));
    if (errors.frequency) {
      setErrors((prev) => ({ ...prev, frequency: "" }));
    }
  };

  const handleDurationSelect = (dur: string) => {
    setSelectedDuration(dur);
    setForm((prev) => ({ ...prev, duration: dur }));
    if (errors.duration) {
      setErrors((prev) => ({ ...prev, duration: "" }));
    }
  };

  const handleDeleteMedication = () => {
    if (!isEditMode || !medicationId) return;

    Alert.alert(
      "Delete Medication",
      "Are you sure you want to delete this medication?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelMedicationReminders(medicationId);
              await deleteMedication(medicationId);
              Alert.alert("Deleted", "Medication deleted successfully", [
                { text: "OK", onPress: () => router.replace("/medications") },
              ]);
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Failed to delete medication.");
            }
          },
        },
      ],
    );
  };

  const renderFrequencyOptions = () => {
    return (
      <View style={styles.optionsGrid}>
        {FREQUENCIES.map((freq) => (
          <TouchableOpacity
            key={freq.id}
            style={[
              styles.optionCard,
              selectedFrequency === freq.label && styles.selectedOptionCard,
            ]}
            onPress={() => {
              handleFrequencySelect(freq.label);
            }}
          >
            <View
              style={[
                styles.optionIcon,
                selectedFrequency === freq.label && styles.selectedOptionIcon,
              ]}
            >
              <Ionicons
                name={freq.icon}
                size={24}
                color={
                  selectedFrequency === freq.label
                    ? "white"
                    : SkeuoTheme.colors.textSecondary
                }
              />
            </View>
            <Text
              style={[
                styles.optionLabel,
                selectedFrequency === freq.label && styles.selectedOptionLabel,
              ]}
            >
              {freq.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDurationOptions = () => {
    return (
      <View style={styles.optionsGrid}>
        {DURATIONS.map((dur) => (
          <TouchableOpacity
            key={dur.id}
            style={[
              styles.optionCard,
              selectedDuration === dur.label && styles.selectedOptionCard,
            ]}
            onPress={() => {
              handleDurationSelect(dur.label);
            }}
          >
            <Text
              style={[
                styles.durationNumber,
                selectedDuration === dur.label && styles.selectedDurationNumber,
              ]}
            >
              {dur.value > 0 ? dur.value : "∞"}
            </Text>
            <Text
              style={[
                styles.optionLabel,
                selectedDuration === dur.label && styles.selectedOptionLabel,
              ]}
            >
              {dur.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          SkeuoTheme.colors.headerGradientStart,
          SkeuoTheme.colors.headerGradientEnd,
        ]}
        style={[styles.headerGradient, { height: insets.top + 94 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      <View style={[styles.content, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={SkeuoTheme.colors.accentDark}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? "Edit Medication" : "New Medication"}
          </Text>
        </View>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContentContainer}
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors.name && styles.inputError]}
                placeholder="Medication Name"
                placeholderTextColor={SkeuoTheme.colors.textTertiary}
                value={form.name}
                onChangeText={(text) => {
                  setForm({ ...form, name: text });
                  if (errors.name) {
                    setErrors({ ...errors, name: "" });
                  }
                }}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors.dosage && styles.inputError]}
                placeholder="Dosage (e.g., 500mg)"
                placeholderTextColor={SkeuoTheme.colors.textTertiary}
                value={form.dosage}
                onChangeText={(text) => {
                  setForm({ ...form, dosage: text });
                  if (errors.dosage) {
                    setErrors({ ...errors, dosage: "" });
                  }
                }}
              />
              {errors.dosage && (
                <Text style={styles.errorText}>{errors.dosage}</Text>
              )}
            </View>
          </View>

          {/* Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How often?</Text>
            {errors.frequency && (
              <Text style={styles.errorText}>{errors.frequency}</Text>
            )}
            {renderFrequencyOptions()}

            <Text style={styles.sectionTitle}>For how long?</Text>
            {errors.duration && (
              <Text style={styles.errorText}>{errors.duration}</Text>
            )}
            {renderDurationOptions()}

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.dateIconContainer}>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={SkeuoTheme.colors.accentDark}
                />
              </View>
              <Text style={styles.dateButtonText}>
                Starts {form.startDate.toLocaleDateString()}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={SkeuoTheme.colors.textSecondary}
              />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={form.startDate}
                mode="date"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setForm({ ...form, startDate: date });
                }}
              />
            )}

            {form.frequency && form.frequency !== "As needed" && (
              <View style={styles.timesContainer}>
                <Text style={styles.timesTitle}>Medication Times</Text>
                {form.times.map((time, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.timeButton}
                    onPress={() => {
                      setSelectedTimeIndex(index);
                      setShowTimePicker(true);
                    }}
                  >
                    <View style={styles.timeIconContainer}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={SkeuoTheme.colors.accentDark}
                      />
                    </View>
                    <Text style={styles.timeButtonText}>{time}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={SkeuoTheme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {showTimePicker && (
              <DateTimePicker
                value={(() => {
                  const [hours, minutes] = form.times[selectedTimeIndex]
                    .split(":")
                    .map(Number);
                  const date = new Date();
                  date.setHours(hours, minutes, 0, 0);
                  return date;
                })()}
                mode="time"
                onChange={(event, date) => {
                  setShowTimePicker(false);
                  if (date) {
                    const newTime = date.toLocaleTimeString("default", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    });
                    setForm((prev) => ({
                      ...prev,
                      times: prev.times.map((t, i) =>
                        i === selectedTimeIndex ? newTime : t,
                      ),
                    }));
                  }
                }}
              />
            )}
          </View>

          {/* Reminders */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="notifications"
                      size={20}
                      color={SkeuoTheme.colors.accentDark}
                    />
                  </View>
                  <View style={styles.switchTextContainer}>
                    <Text style={styles.switchLabel}>Reminders</Text>
                    <Text style={styles.switchSubLabel}>
                      Get notified when it&apos;s time to take your medication
                    </Text>
                  </View>
                </View>
                <Switch
                  style={styles.switchControl}
                  value={form.reminderEnabled}
                  onValueChange={(value) =>
                    setForm({ ...form, reminderEnabled: value })
                  }
                  trackColor={{
                    false: SkeuoTheme.colors.border,
                    true: SkeuoTheme.colors.accent,
                  }}
                  thumbColor="white"
                />
              </View>
            </View>
          </View>

          {/* Refill Tracking */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="reload"
                      size={20}
                      color={SkeuoTheme.colors.accentDark}
                    />
                  </View>
                  <View style={styles.switchTextContainer}>
                    <Text style={styles.switchLabel}>Refill Tracking</Text>
                    <Text style={styles.switchSubLabel}>
                      Get notified when you need to refill
                    </Text>
                  </View>
                </View>
                <Switch
                  style={styles.switchControl}
                  value={form.refillReminder}
                  onValueChange={(value) => {
                    setForm({ ...form, refillReminder: value });
                    if (!value) {
                      setErrors({
                        ...errors,
                        currentSupply: "",
                        refillAt: "",
                      });
                    }
                  }}
                  trackColor={{
                    false: SkeuoTheme.colors.border,
                    true: SkeuoTheme.colors.accent,
                  }}
                  thumbColor="white"
                />
              </View>
              {form.refillReminder && (
                <View style={styles.refillInputs}>
                  <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, styles.flex1]}>
                      <TextInput
                        style={[
                          styles.input,
                          errors.currentSupply && styles.inputError,
                        ]}
                        placeholder="Current Supply"
                        placeholderTextColor={SkeuoTheme.colors.textTertiary}
                        value={form.currentSupply}
                        onChangeText={(text) => {
                          setForm({ ...form, currentSupply: text });
                          if (errors.currentSupply) {
                            setErrors({ ...errors, currentSupply: "" });
                          }
                        }}
                        keyboardType="numeric"
                      />
                      {errors.currentSupply && (
                        <Text style={styles.errorText}>
                          {errors.currentSupply}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.inputContainer, styles.flex1]}>
                      <TextInput
                        style={[
                          styles.input,
                          errors.refillAt && styles.inputError,
                        ]}
                        placeholder="Alert at"
                        placeholderTextColor={SkeuoTheme.colors.textTertiary}
                        value={form.refillAt}
                        onChangeText={(text) => {
                          setForm({ ...form, refillAt: text });
                          if (errors.refillAt) {
                            setErrors({ ...errors, refillAt: "" });
                          }
                        }}
                        keyboardType="numeric"
                      />
                      {errors.refillAt && (
                        <Text style={styles.errorText}>{errors.refillAt}</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Add notes or special instructions..."
                placeholderTextColor={SkeuoTheme.colors.textTertiary}
                value={form.notes}
                onChangeText={(text) => setForm({ ...form, notes: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              isSubmitting && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={[
                SkeuoTheme.colors.headerGradientStart,
                SkeuoTheme.colors.headerGradientEnd,
              ]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting
                  ? isEditMode
                    ? "Saving..."
                    : "Adding..."
                  : isEditMode
                    ? "Save Changes"
                    : "Add Medication"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {isEditMode && (
            <TouchableOpacity
              style={styles.deleteFooterButton}
              onPress={handleDeleteMedication}
              disabled={isSubmitting}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={SkeuoTheme.colors.danger}
              />
              <Text style={styles.deleteFooterButtonText}>
                Delete Medication
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        transparent
        visible={showValidationModal}
        animationType="fade"
        onRequestClose={() => setShowValidationModal(false)}
      >
        <View style={styles.validationOverlay}>
          <View style={styles.validationModal}>
            <View style={styles.validationHeader}>
              <Ionicons
                name="warning-outline"
                size={22}
                color={SkeuoTheme.colors.warning}
              />
              <Text style={styles.validationTitle}>
                Please complete the form
              </Text>
            </View>
            <Text style={styles.validationSubtitle}>
              We found these missing or invalid fields:
            </Text>

            <View style={styles.validationList}>
              {validationIssues.map((issue, index) => (
                <View key={`${issue}-${index}`} style={styles.validationItem}>
                  <Ionicons
                    name="ellipse"
                    size={8}
                    color={SkeuoTheme.colors.textSecondary}
                  />
                  <Text style={styles.validationItemText}>{issue}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.validationButton}
              onPress={() => setShowValidationModal(false)}
            >
              <Text style={styles.validationButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SkeuoTheme.colors.pageBackground,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  content: {
    flex: 1,
    paddingTop: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    minHeight: 56,
    paddingBottom: 20,
    zIndex: 1,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    shadowColor: "#5f807f",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginLeft: 15,
  },
  formContainer: {
    flex: 1,
  },
  formContentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 15,
    marginTop: 10,
  },
  mainInput: {
    fontSize: 20,
    color: SkeuoTheme.colors.textPrimary,
    padding: 15,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  optionCard: {
    width: (width - 60) / 2,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 16,
    padding: 15,
    margin: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    shadowColor: "#5f807f",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedOptionCard: {
    backgroundColor: SkeuoTheme.colors.accent,
    borderColor: SkeuoTheme.colors.accent,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  selectedOptionIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: SkeuoTheme.colors.textPrimary,
    textAlign: "center",
  },
  selectedOptionLabel: {
    color: "white",
  },
  durationNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: SkeuoTheme.colors.accentDark,
    marginBottom: 5,
  },
  selectedDurationNumber: {
    color: "white",
  },
  inputContainer: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    shadowColor: "#5f807f",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 16,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    shadowColor: "#5f807f",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: SkeuoTheme.colors.textPrimary,
  },
  card: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    shadowColor: "#5f807f",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  switchTextContainer: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  switchControl: {
    marginLeft: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: SkeuoTheme.colors.textPrimary,
  },
  switchSubLabel: {
    fontSize: 13,
    color: SkeuoTheme.colors.textSecondary,
    marginTop: 2,
    flexShrink: 1,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  input: {
    padding: 15,
    fontSize: 16,
    color: SkeuoTheme.colors.textPrimary,
  },
  textAreaContainer: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    shadowColor: "#5f807f",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  textArea: {
    height: 100,
    padding: 15,
    fontSize: 16,
    color: SkeuoTheme.colors.textPrimary,
  },
  footer: {
    padding: 20,
    backgroundColor: SkeuoTheme.colors.pageBackground,
    borderTopWidth: 1,
    borderTopColor: SkeuoTheme.colors.border,
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  saveButtonGradient: {
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.cardBackground,
  },
  cancelButtonText: {
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  deleteFooterButton: {
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.dangerBorder,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.dangerSurface,
    flexDirection: "row",
    gap: 8,
  },
  deleteFooterButtonText: {
    color: SkeuoTheme.colors.danger,
    fontSize: 15,
    fontWeight: "700",
  },
  inputError: {
    borderColor: SkeuoTheme.colors.danger,
  },
  errorText: {
    color: SkeuoTheme.colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  refillInputs: {
    marginTop: 15,
  },
  timesContainer: {
    marginTop: 20,
  },
  timesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 10,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    shadowColor: "#5f807f",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  timeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  timeButtonText: {
    flex: 1,
    fontSize: 16,
    color: SkeuoTheme.colors.textPrimary,
  },
  validationOverlay: {
    flex: 1,
    backgroundColor: SkeuoTheme.colors.overlayDark,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  validationModal: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 18,
  },
  validationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  validationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
  },
  validationSubtitle: {
    marginTop: 8,
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 14,
  },
  validationList: {
    marginTop: 12,
    gap: 8,
  },
  validationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  validationItemText: {
    flex: 1,
    color: SkeuoTheme.colors.textPrimary,
    fontSize: 14,
  },
  validationButton: {
    marginTop: 16,
    backgroundColor: SkeuoTheme.colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  validationButtonText: {
    color: SkeuoTheme.colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
