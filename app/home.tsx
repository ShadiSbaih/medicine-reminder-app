import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    AppState,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { SkeuoTheme } from "../constants/theme";
import {
    registerForPushNotificationsAsync,
    updateMedicationReminders,
} from "../utils/notifications";
import {
    DoseHistory,
    getMedications,
    getReadNotificationIds,
    getTodaysDoses,
    markNotificationAsRead,
    markNotificationsAsRead,
    Medication,
    recordDose,
} from "../utils/storage";

const { width } = Dimensions.get("window");

// Create animated circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const QUICK_ACTIONS = [
  {
    icon: "add-circle-outline" as const,
    label: "Add\nMedication",
    route: "/medications" as const,
    color: "#20B486",
    gradient: ["#26C89A", "#117A66"] as [string, string],
  },
  {
    icon: "calendar-outline" as const,
    label: "Calendar\nView",
    route: "/calendar" as const,
    color: "#3B82F6",
    gradient: ["#5B9DFF", "#2D5BBF"] as [string, string],
  },
  {
    icon: "time-outline" as const,
    label: "History\nLog",
    route: "/history" as const,
    color: "#E58A2E",
    gradient: ["#F3A94B", "#CF6F1B"] as [string, string],
  },
  {
    icon: "medical-outline" as const,
    label: "Refill\nTracker",
    route: "/refills" as const,
    color: "#7C66E6",
    gradient: ["#9580F5", "#5A43BF"] as [string, string],
  },
];

interface CircularProgressProps {
  progress: number;
  totalDoses: number;
  completedDoses: number;
}

interface ScheduledDose {
  id: string;
  medication: Medication;
  scheduledTime?: string;
  timeLabel: string;
}

interface NotificationItem extends ScheduledDose {
  isRead: boolean;
  isOverdue: boolean;
}

function parseDurationDays(duration: string): number {
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

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function isMedicationActiveOnDate(medication: Medication, date: Date): boolean {
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

function CircularProgress({
  progress,
  totalDoses,
  completedDoses,
}: CircularProgressProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const size = width * 0.55;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [progress, animatedValue]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressPercentage}>
          {Math.round(progress * 100)}%
        </Text>
        <Text style={styles.progressDetails}>
          {completedDoses} of {totalDoses} doses
        </Text>
      </View>
      <Svg width={size} height={size} style={styles.progressRing}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="white"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [showNotifications, setShowNotifications] = useState(false);
  const [scheduledDoses, setScheduledDoses] = useState<ScheduledDose[]>([]);
  const [completedDoses, setCompletedDoses] = useState(0);
  const [doseHistory, setDoseHistory] = useState<DoseHistory[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  const loadMedications = useCallback(async () => {
    try {
      const [allMedications, todaysDoses] = await Promise.all([
        getMedications(),
        getTodaysDoses(),
      ]);

      setDoseHistory(todaysDoses);

      // Filter medications for today
      const today = new Date();
      const todayMeds = allMedications.filter((med) =>
        isMedicationActiveOnDate(med, today),
      );

      const todaySchedule = todayMeds.flatMap((medication) => {
        if (!medication.times.length) {
          return [
            {
              id: `${medication.id}-as-needed`,
              medication,
              timeLabel: "As needed",
            },
          ];
        }
        return medication.times.map((time) => ({
          id: `${medication.id}-${time}`,
          medication,
          scheduledTime: time,
          timeLabel: time,
        }));
      });

      setScheduledDoses(todaySchedule);

      const uniqueCompletedSchedule = new Set(
        todaysDoses
          .filter((dose) => dose.taken && dose.scheduledTime)
          .map((dose) => `${dose.medicationId}-${dose.scheduledTime}`),
      );

      const completed = uniqueCompletedSchedule.size;
      setCompletedDoses(completed);
    } catch (error) {
      console.error("Error loading medications:", error);
    }
  }, []);

  const setupNotifications = useCallback(async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        console.log("Failed to get push notification token");
        return;
      }

      // Schedule reminders for all medications
      const medications = await getMedications();
      for (const medication of medications) {
        if (medication.reminderEnabled || medication.refillReminder) {
          await updateMedicationReminders(medication);
        }
      }
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  }, []);

  // Use useEffect for initial load
  useEffect(() => {
    loadMedications();
    setupNotifications();

    // Handle app state changes for notifications
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        loadMedications();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadMedications, setupNotifications]);

  const todayKey = new Date().toISOString().slice(0, 10);

  const loadReadNotifications = useCallback(async () => {
    const readIds = await getReadNotificationIds(todayKey);
    setReadNotificationIds(readIds);
  }, [todayKey]);

  // Use useFocusEffect for subsequent updates
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = () => {
        // Cleanup if needed
      };

      loadMedications();
      loadReadNotifications();
      return () => unsubscribe();
    }, [loadMedications, loadReadNotifications]),
  );

  const handleTakeDose = async (
    medication: Medication,
    scheduledTime?: string,
  ) => {
    try {
      await recordDose(
        medication.id,
        true,
        new Date().toISOString(),
        scheduledTime,
      );
      await loadMedications(); // Reload data after recording dose
    } catch (error) {
      console.error("Error recording dose:", error);
      Alert.alert("Error", "Failed to record dose. Please try again.");
    }
  };

  const isDoseTaken = (medicationId: string, scheduledTime?: string) => {
    return doseHistory.some(
      (dose) =>
        dose.medicationId === medicationId &&
        dose.taken &&
        (!scheduledTime || dose.scheduledTime === scheduledTime),
    );
  };

  const totalScheduledDoses = scheduledDoses.filter((dose) =>
    Boolean(dose.scheduledTime),
  ).length;

  const timeToTodayDate = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const scheduledDosesSorted = [...scheduledDoses].sort((a, b) => {
    if (!a.scheduledTime && !b.scheduledTime) return 0;
    if (!a.scheduledTime) return 1;
    if (!b.scheduledTime) return -1;
    return (
      timeToTodayDate(a.scheduledTime).getTime() -
      timeToTodayDate(b.scheduledTime).getTime()
    );
  });

  const pendingScheduledDoses = scheduledDosesSorted.filter(
    (dose) =>
      dose.scheduledTime &&
      !isDoseTaken(dose.medication.id, dose.scheduledTime),
  );

  const now = new Date();
  const overdueCount = pendingScheduledDoses.filter(
    (dose) => dose.scheduledTime && timeToTodayDate(dose.scheduledTime) < now,
  ).length;

  const nextUpcomingDose = pendingScheduledDoses.find(
    (dose) => dose.scheduledTime && timeToTodayDate(dose.scheduledTime) >= now,
  );

  const nextDueDose = nextUpcomingDose ?? pendingScheduledDoses[0];

  const notificationItems: NotificationItem[] = scheduledDosesSorted.map(
    (dose) => {
      if (!dose.scheduledTime) {
        return {
          ...dose,
          isRead: true,
          isOverdue: false,
        };
      }

      const taken = isDoseTaken(dose.medication.id, dose.scheduledTime);
      const isOverdue =
        Boolean(dose.scheduledTime) &&
        !taken &&
        timeToTodayDate(dose.scheduledTime as string) < now;
      return {
        ...dose,
        isRead: taken || readNotificationIds.includes(dose.id),
        isOverdue,
      };
    },
  );

  const unreadNotificationCount = notificationItems.filter(
    (item) => !item.isRead && Boolean(item.scheduledTime),
  ).length;

  const handleMarkNotificationRead = async (notificationId: string) => {
    if (readNotificationIds.includes(notificationId)) return;
    await markNotificationAsRead(todayKey, notificationId);
    setReadNotificationIds((prev) => [...prev, notificationId]);
  };

  const handleMarkAllNotificationsRead = async () => {
    const unreadIds = notificationItems
      .filter((item) => !item.isRead)
      .map((item) => item.id);
    if (unreadIds.length === 0) return;

    await markNotificationsAsRead(todayKey, unreadIds);
    setReadNotificationIds((prev) =>
      Array.from(new Set([...prev, ...unreadIds])),
    );
  };

  const progress =
    totalScheduledDoses > 0 ? completedDoses / totalScheduledDoses : 0;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[
          SkeuoTheme.colors.headerGradientStart,
          SkeuoTheme.colors.headerGradientEnd,
        ]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.flex1}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.greetingSub}>
                Here is your medication plan for today
              </Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setShowNotifications(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
              {unreadNotificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>
                    {unreadNotificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <CircularProgress
            progress={progress}
            totalDoses={totalScheduledDoses}
            completedDoses={completedDoses}
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.focusSection}>
          <View style={styles.focusCard}>
            <View style={styles.focusHeaderRow}>
              <Text style={styles.focusTitle}>Dose Focus</Text>
              {overdueCount > 0 ? (
                <View style={styles.overdueBadge}>
                  <Text style={styles.overdueText}>{overdueCount} overdue</Text>
                </View>
              ) : (
                <View style={styles.onTrackBadge}>
                  <Text style={styles.onTrackText}>On track</Text>
                </View>
              )}
            </View>

            {nextDueDose ? (
              <>
                <Text style={styles.focusMedication}>
                  {nextDueDose.medication.name}
                </Text>
                <Text style={styles.focusMeta}>
                  {nextDueDose.medication.dosage} • {nextDueDose.timeLabel}
                </Text>
                <TouchableOpacity
                  style={styles.focusActionButton}
                  onPress={() =>
                    handleTakeDose(
                      nextDueDose.medication,
                      nextDueDose.scheduledTime,
                    )
                  }
                >
                  <Text style={styles.focusActionText}>Mark as Taken</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.focusMedication}>
                  All scheduled doses are complete
                </Text>
                <Text style={styles.focusMeta}>
                  Nice work. You are done for today.
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Link href={action.route as any} key={action.label} asChild>
                <TouchableOpacity style={styles.actionButton}>
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.actionGradient}
                  >
                    <View style={styles.actionContent}>
                      <View
                        style={[
                          styles.actionIcon,
                          { backgroundColor: `${action.color}55` },
                        ]}
                      >
                        <Ionicons name={action.icon} size={28} color="white" />
                      </View>
                      <Text style={styles.actionLabel}>{action.label}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
            <Link href="/calendar" asChild>
              <TouchableOpacity>
                <Text style={styles.seeAllButton}>See All</Text>
              </TouchableOpacity>
            </Link>
          </View>
          {scheduledDoses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="medical-outline"
                size={48}
                color={SkeuoTheme.colors.textTertiary}
              />
              <Text style={styles.emptyStateText}>
                No medications scheduled for today
              </Text>
              <Link href="/medications/add" asChild>
                <TouchableOpacity style={styles.addMedicationButton}>
                  <Text style={styles.addMedicationButtonText}>
                    Add Medication
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            scheduledDosesSorted.map((doseItem) => {
              const { medication, scheduledTime, timeLabel } = doseItem;
              const taken = isDoseTaken(medication.id, scheduledTime);
              const isOverdue =
                Boolean(scheduledTime) &&
                !taken &&
                timeToTodayDate(scheduledTime as string) < now;
              return (
                <View key={doseItem.id} style={styles.doseCard}>
                  <View
                    style={[
                      styles.doseBadge,
                      { backgroundColor: `${medication.color}15` },
                    ]}
                  >
                    <Ionicons
                      name="medical"
                      size={24}
                      color={medication.color}
                    />
                  </View>
                  <View style={styles.doseInfo}>
                    <View>
                      <Text style={styles.medicineName}>{medication.name}</Text>
                      <Text style={styles.dosageInfo}>{medication.dosage}</Text>
                    </View>
                    <View style={styles.doseTime}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={SkeuoTheme.colors.textSecondary}
                      />
                      <Text style={styles.timeText}>{timeLabel}</Text>
                    </View>
                    {!taken && (
                      <Text style={styles.scheduleStateText}>
                        {scheduledTime
                          ? isOverdue
                            ? "Due now"
                            : "Upcoming"
                          : "As needed"}
                      </Text>
                    )}
                  </View>
                  {taken ? (
                    <View style={[styles.takenBadge]}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={SkeuoTheme.colors.success}
                      />
                      <Text style={styles.takenText}>Taken</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.takeDoseButton,
                        { backgroundColor: medication.color },
                      ]}
                      onPress={() => handleTakeDose(medication, scheduledTime)}
                    >
                      <Text style={styles.takeDoseText}>
                        {scheduledTime ? "Take" : "Log"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </View>

      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Notifications</Text>
                <Text style={styles.modalSubtitle}>
                  {unreadNotificationCount} unread of {notificationItems.length}
                </Text>
              </View>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  onPress={handleMarkAllNotificationsRead}
                  style={styles.markAllButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowNotifications(false)}
                  style={styles.closeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={SkeuoTheme.colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {notificationItems.map((doseItem) => (
              <TouchableOpacity
                key={doseItem.id}
                style={[
                  styles.notificationItem,
                  doseItem.isRead && styles.notificationItemRead,
                ]}
                onPress={() => handleMarkNotificationRead(doseItem.id)}
                activeOpacity={0.8}
              >
                <View style={styles.notificationIcon}>
                  <Ionicons
                    name={doseItem.isRead ? "checkmark-done" : "medical"}
                    size={24}
                    color={
                      doseItem.isRead
                        ? SkeuoTheme.colors.accentDark
                        : doseItem.medication.color
                    }
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    {doseItem.medication.name}
                  </Text>
                  <Text style={styles.notificationMessage}>
                    {doseItem.medication.dosage}
                  </Text>
                  <Text style={styles.notificationMeta}>
                    {doseItem.scheduledTime
                      ? doseItem.isOverdue
                        ? "Overdue"
                        : "Scheduled"
                      : "As needed"}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {doseItem.timeLabel}
                  </Text>
                </View>
                {!doseItem.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SkeuoTheme.colors.pageBackground,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "600",
    color: SkeuoTheme.colors.white,
    opacity: 0.9,
  },
  greetingSub: {
    marginTop: 2,
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  focusSection: {
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  focusCard: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: SkeuoTheme.radius.md,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 16,
    shadowColor: "#5f807f",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  focusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
  },
  overdueBadge: {
    backgroundColor: SkeuoTheme.colors.dangerSurface,
    borderColor: SkeuoTheme.colors.dangerBorder,
    borderWidth: 1,
    borderRadius: SkeuoTheme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: "700",
    color: SkeuoTheme.colors.danger,
  },
  onTrackBadge: {
    backgroundColor: SkeuoTheme.colors.successSurface,
    borderRadius: SkeuoTheme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  onTrackText: {
    fontSize: 12,
    fontWeight: "700",
    color: SkeuoTheme.colors.success,
  },
  focusMedication: {
    fontSize: 17,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 4,
  },
  focusMeta: {
    fontSize: 14,
    color: SkeuoTheme.colors.textSecondary,
    marginBottom: 12,
  },
  focusActionButton: {
    alignSelf: "flex-start",
    backgroundColor: SkeuoTheme.colors.accent,
    borderRadius: SkeuoTheme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  focusActionText: {
    color: SkeuoTheme.colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 15,
  },
  actionButton: {
    width: (width - 52) / 2,
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionGradient: {
    flex: 1,
    padding: 15,
  },
  actionContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 5,
  },
  seeAllButton: {
    color: SkeuoTheme.colors.accent,
    fontWeight: "600",
  },
  doseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: SkeuoTheme.radius.md,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#5f807f",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  doseBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  doseInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "600",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 4,
  },
  dosageInfo: {
    fontSize: 14,
    color: SkeuoTheme.colors.textSecondary,
    marginBottom: 4,
  },
  doseTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    marginLeft: 5,
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 14,
  },
  scheduleStateText: {
    fontSize: 12,
    color: SkeuoTheme.colors.textTertiary,
    marginTop: 4,
    fontWeight: "600",
  },
  takeDoseButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginLeft: 10,
  },
  takeDoseText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  progressTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  progressPercentage: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
  },
  progressLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  progressRing: {
    transform: [{ rotate: "-90deg" }],
  },
  flex1: {
    flex: 1,
  },
  notificationButton: {
    position: "relative",
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    marginLeft: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: SkeuoTheme.colors.danger,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: SkeuoTheme.colors.headerGradientEnd,
    paddingHorizontal: 4,
  },
  notificationCount: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  progressDetails: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: SkeuoTheme.colors.overlayDark,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: SkeuoTheme.colors.textPrimary,
  },
  modalSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: SkeuoTheme.colors.textSecondary,
  },
  markAllButton: {
    backgroundColor: SkeuoTheme.colors.accentSoft,
    borderRadius: SkeuoTheme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markAllText: {
    color: SkeuoTheme.colors.accentDark,
    fontSize: 12,
    fontWeight: "700",
  },
  closeButton: {
    padding: 5,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    backgroundColor: SkeuoTheme.colors.pageBackground,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    marginBottom: 10,
  },
  notificationItemRead: {
    opacity: 0.7,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SkeuoTheme.colors.successSurface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: SkeuoTheme.colors.textSecondary,
    marginBottom: 2,
  },
  notificationMeta: {
    fontSize: 12,
    color: SkeuoTheme.colors.accentDark,
    fontWeight: "600",
  },
  notificationTime: {
    fontSize: 12,
    color: SkeuoTheme.colors.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SkeuoTheme.colors.accent,
    marginLeft: 10,
  },
  emptyState: {
    alignItems: "center",
    padding: 30,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 16,
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: SkeuoTheme.colors.textSecondary,
    marginTop: 10,
    marginBottom: 20,
  },
  addMedicationButton: {
    backgroundColor: SkeuoTheme.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addMedicationButtonText: {
    color: "white",
    fontWeight: "600",
  },
  takenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.successSurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  takenText: {
    color: SkeuoTheme.colors.success,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 4,
  },
});
