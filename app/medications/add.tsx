import {
    getDeleteConfirmationAlert,
    getDeleteFailureAlert,
    getDeleteSuccessAlert,
    getEntityNotFoundAlert,
    getSaveFailureAlert,
    getSaveSuccessAlert,
} from "@/constants/feedback-copy";
import { medicationService } from "@/services/medication-service";
import { useMedicationStore } from "@/stores/medication-store";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
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
  {
    id: "5",
    label: "As needed",
    icon: "calendar-outline" as const,
    times: [],
  },
];

const DURATIONS = [
  { id: "1", label: "7 days", value: 7 },
  { id: "2", label: "14 days", value: 14 },
  { id: "3", label: "30 days", value: 30 },
  { id: "4", label: "90 days", value: 90 },
  { id: "5", label: "Ongoing", value: -1 },
];

const WIZARD_STEPS = ["Basic", "Schedule", "Reminders"];

type FormState = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  startDate: Date;
  times: string[];
  notes: string;
  reminderEnabled: boolean;
  refillReminder: boolean;
  currentSupply: string;
  refillAt: string;
};

type FormErrors = Record<string, string>;

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function AddMedicationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { medicationId } = useLocalSearchParams<{ medicationId?: string }>();
  const isEditMode = Boolean(medicationId);

  const [form, setForm] = useState<FormState>({
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

  const [errors, setErrors] = useState<FormErrors>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [loadedMedicationColor, setLoadedMedicationColor] = useState("#2DB19A");
  const [loadedTotalSupply, setLoadedTotalSupply] = useState(0);
  const addMedication = useMedicationStore((state) => state.addMedication);
  const updateMedicationInStore = useMedicationStore(
    (state) => state.updateMedication,
  );
  const removeMedication = useMedicationStore((state) => state.removeMedication);

  useEffect(() => {
    if (!isEditMode || !medicationId) return;

    const loadMedicationForEdit = async () => {
      const existing = await medicationService.getById(medicationId);
      if (!existing) {
        const notFound = getEntityNotFoundAlert("Medication");
        Alert.alert(notFound.title, notFound.message, [
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
    };

    loadMedicationForEdit();
  }, [isEditMode, medicationId, router]);

  const stepDescription = useMemo(() => {
    if (currentStep === 0) return "Medication identity";
    if (currentStep === 1) return "Frequency and times";
    return "Alerts, stock, and notes";
  }, [currentStep]);

  const buildValidationErrors = (state: FormState): FormErrors => {
    const newErrors: FormErrors = {};

    if (!state.name.trim()) {
      newErrors.name = "Medication name is required";
    }

    if (!state.dosage.trim()) {
      newErrors.dosage = "Dosage is required";
    }

    if (!state.frequency) {
      newErrors.frequency = "Frequency is required";
    }

    if (!state.duration) {
      newErrors.duration = "Duration is required";
    }

    if (state.frequency !== "As needed" && state.times.length === 0) {
      newErrors.times = "At least one dose time is required";
    }

    if (state.refillReminder) {
      if (!state.currentSupply) {
        newErrors.currentSupply =
          "Current supply is required for refill tracking";
      }
      if (!state.refillAt) {
        newErrors.refillAt = "Refill alert threshold is required";
      }
      if (Number(state.currentSupply) <= 0) {
        newErrors.currentSupply = "Current supply must be greater than zero";
      }
      if (Number(state.refillAt) < 0) {
        newErrors.refillAt = "Refill alert must be zero or greater";
      }
      if (
        Number(state.currentSupply) > 0 &&
        Number(state.refillAt) >= Number(state.currentSupply)
      ) {
        newErrors.refillAt = "Refill alert must be less than current supply";
      }
    }

    return newErrors;
  };

  const validateForStep = (step: number): boolean => {
    const allErrors = buildValidationErrors(form);
    const stepFields =
      step === 0
        ? ["name", "dosage"]
        : step === 1
          ? ["frequency", "duration", "times"]
          : ["currentSupply", "refillAt"];

    const stepErrors = Object.fromEntries(
      Object.entries(allErrors).filter(([key]) => stepFields.includes(key)),
    );

    setErrors(allErrors);

    const issues = Object.values(stepErrors);
    setValidationIssues(issues);
    setShowValidationModal(issues.length > 0);

    return issues.length === 0;
  };

  const validateAll = (): boolean => {
    const allErrors = buildValidationErrors(form);
    setErrors(allErrors);
    const issues = Object.values(allErrors);
    setValidationIssues(issues);
    setShowValidationModal(issues.length > 0);
    return issues.length === 0;
  };

  const handleFrequencySelect = (freq: string) => {
    const selectedFreq = FREQUENCIES.find((f) => f.label === freq);
    setForm((prev) => ({
      ...prev,
      frequency: freq,
      times: selectedFreq?.times ? [...selectedFreq.times] : [],
    }));
  };

  const handleDurationSelect = (dur: string) => {
    setForm((prev) => ({ ...prev, duration: dur }));
  };

  const handleAddTime = () => {
    setForm((prev) => ({ ...prev, times: [...prev.times, "09:00"] }));
  };

  const handleRemoveTime = (index: number) => {
    setForm((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      if (!validateAll()) {
        return;
      }

      if (isSubmitting) return;
      setIsSubmitting(true);

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
        color: loadedMedicationColor,
      };

      if (isEditMode) {
        await updateMedicationInStore(medicationData);
      } else {
        await addMedication({
          ...medicationData,
          id: undefined,
          color: undefined,
        });
      }

      setIsSubmitting(false);

      const success = getSaveSuccessAlert(isEditMode);
      Alert.alert(
        success.title,
        success.message,
        [{ text: "OK", onPress: () => router.back() }],
        {
          cancelable: false,
        },
      );
    } catch (error) {
      console.error("Save error:", error);
      const failure = getSaveFailureAlert();
      Alert.alert(failure.title, failure.message, [{ text: "OK" }], {
        cancelable: false,
      });
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedication = () => {
    if (!isEditMode || !medicationId) return;

    const copy = getDeleteConfirmationAlert();
    Alert.alert(copy.title, copy.message, [
      { text: copy.cancelLabel, style: "cancel" },
      {
        text: copy.confirmLabel,
        style: "destructive",
        onPress: async () => {
          try {
            await removeMedication(medicationId);
            const success = getDeleteSuccessAlert();
            Alert.alert(success.title, success.message, [
              { text: "OK", onPress: () => router.back() },
            ]);
          } catch (error) {
            console.error("Delete error:", error);
            const failure = getDeleteFailureAlert();
            Alert.alert(failure.title, failure.message);
          }
        },
      },
    ]);
  };

  const handlePrimaryAction = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      if (validateForStep(currentStep)) {
        setCurrentStep((prev) => prev + 1);
      }
      return;
    }
    handleSave();
  };

  const renderStepBasic = () => (
    <View style={[styles.section, styles.basicSection]}>
      <View>
        <Text style={styles.sectionTitle}>Basic Info</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.mainInput, errors.name && styles.inputError]}
            placeholder="Medication Name"
            placeholderTextColor={SkeuoTheme.colors.textTertiary}
            value={form.name}
            onChangeText={(text) => {
              setForm((prev) => ({ ...prev, name: text }));
            }}
          />
        </View>
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.mainInput, errors.dosage && styles.inputError]}
            placeholder="Dosage (e.g., 500mg)"
            placeholderTextColor={SkeuoTheme.colors.textTertiary}
            value={form.dosage}
            onChangeText={(text) => {
              setForm((prev) => ({ ...prev, dosage: text }));
            }}
          />
        </View>
        {errors.dosage && <Text style={styles.errorText}>{errors.dosage}</Text>}
      </View>

      <View style={styles.progressHintCard}>
        <View style={styles.progressHintHeader}>
          <Ionicons
            name="sparkles-outline"
            size={18}
            color={SkeuoTheme.colors.accentDark}
          />
          <Text style={styles.progressHintTitle}>What comes next</Text>
        </View>

        <View style={styles.progressHintRow}>
          <Ionicons
            name="time-outline"
            size={16}
            color={SkeuoTheme.colors.textSecondary}
          />
          <Text style={styles.progressHintText}>
            Choose frequency and dose times.
          </Text>
        </View>
        <View style={styles.progressHintRow}>
          <Ionicons
            name="notifications-outline"
            size={16}
            color={SkeuoTheme.colors.textSecondary}
          />
          <Text style={styles.progressHintText}>
            Configure reminders and refill alerts.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStepSchedule = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Schedule</Text>
      {errors.frequency && (
        <Text style={styles.errorText}>{errors.frequency}</Text>
      )}

      <View style={styles.optionsGrid}>
        {FREQUENCIES.map((freq) => (
          <TouchableOpacity
            key={freq.id}
            style={[
              styles.optionCard,
              form.frequency === freq.label && styles.selectedOptionCard,
            ]}
            onPress={() => handleFrequencySelect(freq.label)}
          >
            <View
              style={[
                styles.optionIcon,
                form.frequency === freq.label && styles.selectedOptionIcon,
              ]}
            >
              <Ionicons
                name={freq.icon}
                size={22}
                color={
                  form.frequency === freq.label
                    ? SkeuoTheme.colors.white
                    : SkeuoTheme.colors.textSecondary
                }
              />
            </View>
            <Text
              style={[
                styles.optionLabel,
                form.frequency === freq.label && styles.selectedOptionLabel,
              ]}
            >
              {freq.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Duration</Text>
      {errors.duration && (
        <Text style={styles.errorText}>{errors.duration}</Text>
      )}
      <View style={styles.optionsGrid}>
        {DURATIONS.map((dur) => (
          <TouchableOpacity
            key={dur.id}
            style={[
              styles.optionCard,
              form.duration === dur.label && styles.selectedOptionCard,
            ]}
            onPress={() => handleDurationSelect(dur.label)}
          >
            <Text
              style={[
                styles.durationNumber,
                form.duration === dur.label && styles.selectedDurationNumber,
              ]}
            >
              {dur.value > 0 ? dur.value : "∞"}
            </Text>
            <Text
              style={[
                styles.optionLabel,
                form.duration === dur.label && styles.selectedOptionLabel,
              ]}
            >
              {dur.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setForm((prev) => ({ ...prev, startDate: date }));
          }}
        />
      )}

      {form.frequency !== "As needed" && (
        <View style={styles.timesContainer}>
          <View style={styles.timeHeaderRow}>
            <Text style={styles.timesTitle}>Dose Times</Text>
            <TouchableOpacity
              style={styles.addTimeButton}
              onPress={handleAddTime}
            >
              <Ionicons name="add" size={16} color={SkeuoTheme.colors.white} />
              <Text style={styles.addTimeButtonText}>Add Time</Text>
            </TouchableOpacity>
          </View>

          {errors.times && <Text style={styles.errorText}>{errors.times}</Text>}

          {(() => {
            const timeOccurrences = new Map<string, number>();
            return form.times.map((time, index) => {
              const occurrence = timeOccurrences.get(time) ?? 0;
              timeOccurrences.set(time, occurrence + 1);
              const timeKey = `${time}-${occurrence}`;

              return (
                <View key={timeKey} style={styles.timeRow}>
                  <TouchableOpacity
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

                  <TouchableOpacity
                    style={[
                      styles.removeTimeButton,
                      form.times.length <= 1 && styles.removeTimeButtonDisabled,
                    ]}
                    disabled={form.times.length <= 1}
                    onPress={() => handleRemoveTime(index)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={SkeuoTheme.colors.danger}
                    />
                  </TouchableOpacity>
                </View>
              );
            });
          })()}
        </View>
      )}

      {showTimePicker && (
        <DateTimePicker
          value={(() => {
            const source = form.times[selectedTimeIndex] ?? "09:00";
            const [hours, minutes] = source.split(":").map(Number);
            const date = new Date();
            date.setHours(hours || 9, minutes || 0, 0, 0);
            return date;
          })()}
          mode="time"
          onChange={(_, date) => {
            setShowTimePicker(false);
            if (!date) return;
            const newTime = formatTime(date);
            setForm((prev) => ({
              ...prev,
              times: prev.times.map((t, i) =>
                i === selectedTimeIndex ? newTime : t,
              ),
            }));
          }}
        />
      )}
    </View>
  );

  const renderStepReminders = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reminders and Inventory</Text>

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
              <Text style={styles.switchLabel}>Dose reminders</Text>
              <Text style={styles.switchSubLabel}>
                Notify when it is time to take this dose
              </Text>
            </View>
          </View>
          <Switch
            style={styles.switchControl}
            value={form.reminderEnabled}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, reminderEnabled: value }))
            }
            trackColor={{
              false: SkeuoTheme.colors.border,
              true: SkeuoTheme.colors.accent,
            }}
            thumbColor={SkeuoTheme.colors.white}
          />
        </View>
      </View>

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
              <Text style={styles.switchLabel}>Refill reminders</Text>
              <Text style={styles.switchSubLabel}>
                Warn when inventory is running low
              </Text>
            </View>
          </View>
          <Switch
            style={styles.switchControl}
            value={form.refillReminder}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, refillReminder: value }))
            }
            trackColor={{
              false: SkeuoTheme.colors.border,
              true: SkeuoTheme.colors.accent,
            }}
            thumbColor={SkeuoTheme.colors.white}
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
                  placeholder="Current supply"
                  placeholderTextColor={SkeuoTheme.colors.textTertiary}
                  value={form.currentSupply}
                  keyboardType="numeric"
                  onChangeText={(text) =>
                    setForm((prev) => ({ ...prev, currentSupply: text }))
                  }
                />
              </View>

              <View style={[styles.inputContainer, styles.flex1]}>
                <TextInput
                  style={[styles.input, errors.refillAt && styles.inputError]}
                  placeholder="Alert at"
                  placeholderTextColor={SkeuoTheme.colors.textTertiary}
                  value={form.refillAt}
                  keyboardType="numeric"
                  onChangeText={(text) =>
                    setForm((prev) => ({ ...prev, refillAt: text }))
                  }
                />
              </View>
            </View>

            {errors.currentSupply && (
              <Text style={styles.errorText}>{errors.currentSupply}</Text>
            )}
            {errors.refillAt && (
              <Text style={styles.errorText}>{errors.refillAt}</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.textAreaContainer}>
        <TextInput
          style={styles.textArea}
          placeholder="Add notes or special instructions..."
          placeholderTextColor={SkeuoTheme.colors.textTertiary}
          value={form.notes}
          onChangeText={(text) => setForm((prev) => ({ ...prev, notes: text }))}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          SkeuoTheme.colors.headerGradientStart,
          SkeuoTheme.colors.headerGradientEnd,
        ]}
        style={[styles.headerGradient, { height: insets.top + 168 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
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
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>
              {isEditMode ? "Edit Medication" : "New Medication"}
            </Text>
            <Text style={styles.headerSubtitle}>{stepDescription}</Text>
          </View>
        </View>

        <View style={styles.stepperRow}>
          {WIZARD_STEPS.map((label, index) => {
            const active = index === currentStep;
            const done = index < currentStep;
            return (
              <View key={label} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    active && styles.stepCircleActive,
                    done && styles.stepCircleDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepCircleText,
                      (active || done) && styles.stepCircleTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  style={[styles.stepLabel, active && styles.stepLabelActive]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContentContainer}
        >
          {currentStep === 0 && renderStepBasic()}
          {currentStep === 1 && renderStepSchedule()}
          {currentStep === 2 && renderStepReminders()}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {currentStep === 0 ? (
            <TouchableOpacity
              style={[
                styles.saveButton,
                styles.saveButtonFull,
                isSubmitting && styles.saveButtonDisabled,
              ]}
              onPress={handlePrimaryAction}
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
                <Text style={styles.saveButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                disabled={isSubmitting}
                onPress={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSubmitting && styles.saveButtonDisabled,
                ]}
                onPress={handlePrimaryAction}
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
                    {currentStep < WIZARD_STEPS.length - 1
                      ? "Continue"
                      : isSubmitting
                        ? isEditMode
                          ? "Saving..."
                          : "Adding..."
                        : isEditMode
                          ? "Save Changes"
                          : "Add Medication"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

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
              {validationIssues.map((issue) => (
                <View key={issue} style={styles.validationItem}>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    minHeight: 62,
    paddingBottom: 10,
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
    ...SkeuoTheme.shadow.outerSoft,
  },
  headerTextWrap: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: SkeuoTheme.colors.white,
  },
  headerSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    overflow: "visible",
  },
  stepItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.46)",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    borderColor: SkeuoTheme.colors.white,
    backgroundColor: SkeuoTheme.colors.white,
  },
  stepCircleDone: {
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  stepCircleText: {
    fontSize: 13,
    fontWeight: "700",
    color: SkeuoTheme.colors.white,
  },
  stepCircleTextActive: {
    color: SkeuoTheme.colors.accentDark,
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 10,
    color: "rgba(255,255,255,0.84)",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  stepLabelActive: {
    color: SkeuoTheme.colors.white,
  },
  formContainer: {
    flex: 1,
  },
  formContentContainer: {
    padding: 20,
    paddingTop: 12,
    flexGrow: 1,
  },
  section: {
    marginBottom: 25,
  },
  basicSection: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: 360,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 14,
  },
  inputContainer: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    ...SkeuoTheme.shadow.outerSoft,
  },
  mainInput: {
    fontSize: 18,
    color: SkeuoTheme.colors.textPrimary,
    padding: 16,
    fontWeight: "600",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  optionCard: {
    width: "48%",
    maxWidth: "48%",
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 18,
    padding: 16,
    margin: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    ...SkeuoTheme.shadow.outerSoft,
  },
  selectedOptionCard: {
    backgroundColor: SkeuoTheme.colors.accent,
    borderColor: SkeuoTheme.colors.accent,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
    textAlign: "center",
  },
  selectedOptionLabel: {
    color: SkeuoTheme.colors.white,
  },
  durationNumber: {
    fontSize: 26,
    fontWeight: "800",
    color: SkeuoTheme.colors.accentDark,
    marginBottom: 5,
  },
  selectedDurationNumber: {
    color: SkeuoTheme.colors.white,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    ...SkeuoTheme.shadow.outerSoft,
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: SkeuoTheme.colors.textPrimary,
    fontWeight: "700",
  },
  timesContainer: {
    marginTop: 16,
  },
  timeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
  },
  addTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: SkeuoTheme.colors.accent,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
  },
  addTimeButtonText: {
    color: SkeuoTheme.colors.white,
    fontWeight: "700",
    fontSize: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  timeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    ...SkeuoTheme.shadow.outerSoft,
  },
  timeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  timeButtonText: {
    flex: 1,
    fontSize: 16,
    color: SkeuoTheme.colors.textPrimary,
    fontWeight: "700",
  },
  removeTimeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.dangerBorder,
    backgroundColor: SkeuoTheme.colors.dangerSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  removeTimeButtonDisabled: {
    opacity: 0.45,
  },
  card: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    marginBottom: 12,
    ...SkeuoTheme.shadow.outerSoft,
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
    borderRadius: 14,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
  },
  switchSubLabel: {
    fontSize: 13,
    color: SkeuoTheme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  refillInputs: {
    marginTop: 14,
  },
  inputRow: {
    flexDirection: "row",
    marginTop: 5,
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    ...SkeuoTheme.shadow.outerSoft,
  },
  textArea: {
    height: 100,
    padding: 16,
    fontSize: 16,
    color: SkeuoTheme.colors.textPrimary,
    lineHeight: 22,
  },
  progressHintCard: {
    marginTop: 18,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 15,
    ...SkeuoTheme.shadow.outerSoft,
  },
  progressHintHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  progressHintTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
  },
  progressHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 7,
  },
  progressHintText: {
    flex: 1,
    fontSize: 13,
    color: SkeuoTheme.colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: SkeuoTheme.colors.pageBackground,
    borderTopWidth: 1,
    borderTopColor: SkeuoTheme.colors.border,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.cardBackground,
  },
  secondaryButtonText: {
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 15,
    fontWeight: "700",
  },
  saveButton: {
    flex: 2,
    borderRadius: 18,
    overflow: "hidden",
    ...SkeuoTheme.shadow.outerSoft,
  },
  saveButtonFull: {
    width: "100%",
    flex: 0,
    marginBottom: 12,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 52,
  },
  saveButtonText: {
    color: SkeuoTheme.colors.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.25,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  deleteFooterButton: {
    marginBottom: 12,
    paddingVertical: 15,
    borderRadius: 18,
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
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 18,
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
  inputError: {
    borderColor: SkeuoTheme.colors.danger,
  },
  errorText: {
    color: SkeuoTheme.colors.danger,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 8,
  },
  validationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  validationModal: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 20,
    ...SkeuoTheme.shadow.outer,
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
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  validationButtonText: {
    color: SkeuoTheme.colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
