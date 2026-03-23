import { FeedbackSnackbar } from "@/components/ui/feedback-snackbar";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getDoseFailureAlert,
  getDoseSuccessMessage,
  getSkipConfirmationCopy,
} from "@/constants/feedback-copy";
import { doseService } from "@/services/dose-service";
import { todayTimelineService } from "@/services/today-timeline-service";
import { buildDoseTimestamp, TimelineDose } from "@/shared/utils/dose-timeline";
import { triggerLightHaptic } from "@/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SkeuoTheme } from "../../constants/theme";
import { DoseHistory, getDoseHistory } from "../../utils/storage";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [doseHistory, setDoseHistory] = useState<DoseHistory[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineDose[]>([]);
  const [selectedTotalScheduled, setSelectedTotalScheduled] = useState(0);
  const [selectedResolvedCount, setSelectedResolvedCount] = useState(0);
  const [selectedOverdueCount, setSelectedOverdueCount] = useState(0);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const showFeedback = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const loadCalendarHistory = useCallback(async () => {
    try {
      const history = await getDoseHistory();
      setDoseHistory(history);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
  }, []);

  const loadSelectedDateTimeline = useCallback(async (date: Date) => {
    try {
      const timeline = await todayTimelineService.getForDate(date);
      setTimelineItems(timeline.items);
      setSelectedTotalScheduled(timeline.totalScheduled);
      setSelectedResolvedCount(
        timeline.items.filter(
          (item) => Boolean(item.scheduledTime) && item.isResolved,
        ).length,
      );
      setSelectedOverdueCount(timeline.overdueCount);
    } catch (error) {
      console.error("Error loading selected date timeline:", error);
    }
  }, []);

  const confirmSkipDose = (
    medicationName: string,
    onConfirm: () => Promise<void>,
    scheduledTime?: string,
  ) => {
    const copy = getSkipConfirmationCopy(medicationName, scheduledTime);
    Alert.alert(copy.title, copy.message, [
      { text: copy.cancelLabel, style: "cancel" },
      {
        text: copy.confirmLabel,
        style: "destructive",
        onPress: () => {
          void onConfirm();
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      loadCalendarHistory();
      loadSelectedDateTimeline(selectedDate);
    }, [loadCalendarHistory, loadSelectedDateTimeline, selectedDate]),
  );

  useEffect(() => {
    loadSelectedDateTimeline(selectedDate);
  }, [loadSelectedDateTimeline, selectedDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(selectedDate);

  const renderCalendar = () => {
    const calendar: React.ReactElement[] = [];
    let week: React.ReactElement[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      week.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Add days of the month
    for (let day = 1; day <= days; day++) {
      const date = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        day,
      );
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const hasDoses = doseHistory.some(
        (dose) =>
          new Date(dose.timestamp).toDateString() === date.toDateString(),
      );

      week.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDay,
            isToday && styles.today,
            hasDoses && styles.hasEvents,
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text
            style={[
              styles.dayText,
              isSelected && styles.selectedDayText,
              isToday && styles.todayText,
            ]}
          >
            {day}
          </Text>
          {hasDoses && <View style={styles.eventDot} />}
        </TouchableOpacity>,
      );

      if ((firstDay + day) % 7 === 0 || day === days) {
        if (day === days && week.length < 7) {
          const trailingEmpty = 7 - week.length;
          for (let i = 0; i < trailingEmpty; i++) {
            week.push(
              <View key={`empty-end-${day}-${i}`} style={styles.calendarDay} />,
            );
          }
        }

        calendar.push(
          <View key={day} style={styles.calendarWeek}>
            {week}
          </View>,
        );
        week = [];
      }
    }

    return calendar;
  };

  const groupedMedications =
    todayTimelineService.groupByMedication(timelineItems);

  const renderMedicationsForDate = () => {
    return groupedMedications.map(({ medication, items }) => {
      const scheduledTimes = items.map((item) => item.timeLabel);
      const takenCount = items.filter((item) => item.taken).length;
      const hasScheduledTimes = items.some((item) =>
        Boolean(item.scheduledTime),
      );
      const allResolved =
        hasScheduledTimes && items.every((item) => item.isResolved);

      const nextDose = items.find((item) => !item.isResolved) ?? items[0];
      const nextTime = nextDose?.scheduledTime;
      const timestamp = buildDoseTimestamp(selectedDate, nextTime);
      const hasSkipped = items.some((item) => item.status === "skipped");
      const resolvedBadge =
        hasSkipped && takenCount === 0 ? "skipped" : "taken";

      return (
        <View key={medication.id} style={styles.medicationCard}>
          <View
            style={[
              styles.medicationColor,
              { backgroundColor: medication.color },
            ]}
          />
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName}>{medication.name}</Text>
            <Text style={styles.medicationDosage}>{medication.dosage}</Text>
            <Text style={styles.medicationTime}>
              {scheduledTimes.join(" · ")}
            </Text>
            {!allResolved && (
              <View style={styles.inlineStatusWrap}>
                <StatusBadge
                  status={nextDose?.isOverdue ? "overdue" : "upcoming"}
                  compact
                />
              </View>
            )}
          </View>
          {allResolved ? (
            <View style={styles.resolvedWrap}>
              <StatusBadge status={resolvedBadge} />
              <Text style={styles.resolvedCountText}>{takenCount} taken</Text>
            </View>
          ) : (
            <View style={styles.doseActionsRow}>
              <TouchableOpacity
                style={[
                  styles.skipDoseButton,
                  { borderColor: medication.color },
                ]}
                onPress={() =>
                  confirmSkipDose(
                    medication.name,
                    async () => {
                      try {
                        if (nextTime) {
                          await doseService.skipScheduledDose(
                            medication.id,
                            nextTime,
                            timestamp,
                          );
                        } else {
                          await doseService.skipAsNeededDose(
                            medication.id,
                            timestamp,
                          );
                        }
                        await loadSelectedDateTimeline(selectedDate);
                        await loadCalendarHistory();
                        void triggerLightHaptic();
                        showFeedback(
                          getDoseSuccessMessage("skip", medication.name),
                        );
                      } catch (error) {
                        console.error("Error skipping dose:", error);
                        const failure = getDoseFailureAlert("skip");
                        Alert.alert(failure.title, failure.message);
                      }
                    },
                    nextTime,
                  )
                }
              >
                <Text
                  style={[styles.skipDoseText, { color: medication.color }]}
                >
                  Skip
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.takeDoseButton,
                  { backgroundColor: medication.color },
                ]}
                onPress={async () => {
                  try {
                    if (nextTime) {
                      await doseService.recordScheduledDose(
                        medication.id,
                        nextTime,
                        timestamp,
                      );
                    } else {
                      await doseService.recordAsNeededDose(
                        medication.id,
                        timestamp,
                      );
                    }
                    await loadSelectedDateTimeline(selectedDate);
                    await loadCalendarHistory();
                    void triggerLightHaptic();
                    showFeedback(
                      getDoseSuccessMessage("take", medication.name),
                    );
                  } catch (error) {
                    console.error("Error recording dose:", error);
                    const failure = getDoseFailureAlert("take");
                    Alert.alert(failure.title, failure.message);
                  }
                }}
              >
                <Text style={styles.takeDoseText}>Take</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          SkeuoTheme.colors.headerGradientStart,
          SkeuoTheme.colors.headerGradientEnd,
        ]}
        style={[styles.headerGradient, { height: insets.top + 92 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      <View style={[styles.content, { paddingTop: insets.top + 6 }]}>
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
          <Text style={styles.headerTitle}>Calendar</Text>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() =>
                setSelectedDate(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() - 1,
                    1,
                  ),
                )
              }
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={SkeuoTheme.colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {selectedDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <TouchableOpacity
              onPress={() =>
                setSelectedDate(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() + 1,
                    1,
                  ),
                )
              }
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={SkeuoTheme.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayHeader}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          {renderCalendar()}
        </View>

        <View style={styles.scheduleContainer}>
          <Text style={styles.scheduleTitle}>
            {selectedDate.toLocaleDateString("default", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <View style={styles.scheduleSummaryRow}>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipLabel}>Resolved</Text>
              <Text style={styles.summaryChipValue}>
                {selectedResolvedCount}/{selectedTotalScheduled}
              </Text>
            </View>
            <View
              style={[
                styles.summaryChip,
                selectedOverdueCount > 0 && styles.summaryChipOverdue,
              ]}
            >
              <Text
                style={[
                  styles.summaryChipLabel,
                  selectedOverdueCount > 0 && styles.summaryChipLabelOverdue,
                ]}
              >
                Overdue
              </Text>
              <Text
                style={[
                  styles.summaryChipValue,
                  selectedOverdueCount > 0 && styles.summaryChipValueOverdue,
                ]}
              >
                {selectedOverdueCount}
              </Text>
            </View>
          </View>
          {groupedMedications.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Ionicons
                name="calendar-clear-outline"
                size={38}
                color={SkeuoTheme.colors.textTertiary}
              />
              <Text style={styles.emptyStateTitle}>No doses for this day</Text>
              <Text style={styles.emptyStateText}>
                Choose another date or add a medication to build your schedule.
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push("/medications/add")}
              >
                <Text style={styles.emptyStateButtonText}>Add Medication</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderMedicationsForDate()}
            </ScrollView>
          )}
        </View>
      </View>
      <FeedbackSnackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        onHide={() => setSnackbarVisible(false)}
      />
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
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#5f807f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginLeft: 15,
  },
  calendarContainer: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 16,
    margin: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    shadowColor: "#5f807f",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
    color: SkeuoTheme.colors.textPrimary,
  },
  weekdayHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    color: SkeuoTheme.colors.textSecondary,
    fontWeight: "500",
  },
  calendarWeek: {
    flexDirection: "row",
    marginBottom: 5,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: SkeuoTheme.colors.textPrimary,
  },
  today: {
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.accent,
    backgroundColor: "rgba(27, 159, 136, 0.08)",
  },
  selectedDay: {
    backgroundColor: SkeuoTheme.colors.accent,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.accentDark,
    shadowColor: SkeuoTheme.colors.accentDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  todayText: {
    color: SkeuoTheme.colors.accentDark,
    fontWeight: "600",
  },
  selectedDayText: {
    color: SkeuoTheme.colors.white,
    fontWeight: "700",
  },
  hasEvents: {
    position: "relative",
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: SkeuoTheme.colors.accent,
    position: "absolute",
    bottom: "15%",
  },
  scheduleContainer: {
    flex: 1,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: "#5f807f",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 10,
  },
  scheduleSummaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  summaryChipOverdue: {
    backgroundColor: SkeuoTheme.colors.dangerSurface,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.dangerBorder,
  },
  summaryChipLabel: {
    fontSize: 12,
    color: SkeuoTheme.colors.textSecondary,
    fontWeight: "600",
  },
  summaryChipValue: {
    fontSize: 12,
    color: SkeuoTheme.colors.textPrimary,
    fontWeight: "700",
  },
  summaryChipLabelOverdue: {
    color: SkeuoTheme.colors.danger,
  },
  summaryChipValueOverdue: {
    color: SkeuoTheme.colors.danger,
  },
  medicationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    shadowColor: "#5f807f",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  medicationColor: {
    width: 12,
    height: 40,
    borderRadius: 6,
    marginRight: 15,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "600",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: SkeuoTheme.colors.textSecondary,
    marginBottom: 2,
  },
  medicationTime: {
    fontSize: 14,
    color: SkeuoTheme.colors.textSecondary,
  },
  inlineStatusWrap: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  resolvedWrap: {
    marginLeft: 10,
    alignItems: "flex-end",
    gap: 4,
  },
  resolvedCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: SkeuoTheme.colors.textSecondary,
  },
  takeDoseButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  doseActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  skipDoseButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: SkeuoTheme.colors.cardBackground,
  },
  skipDoseText: {
    fontWeight: "600",
    fontSize: 14,
  },
  takeDoseText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyStateCard: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  emptyStateTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: SkeuoTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyStateButton: {
    backgroundColor: SkeuoTheme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  emptyStateButtonText: {
    color: SkeuoTheme.colors.white,
    fontWeight: "700",
  },
});
