import { FeedbackSnackbar } from "@/components/ui/feedback-snackbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { doseService } from "@/services/dose-service";
import { todayTimelineService } from "@/services/today-timeline-service";
import { TimelineDose } from "@/shared/utils/dose-timeline";
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
import { SkeuoTheme } from "../../constants/theme";
import {
  registerForPushNotificationsAsync,
  updateMedicationReminders,
} from "../../utils/notifications";
import {
  getMedications,
  getReadNotificationIds,
  markNotificationAsRead,
  markNotificationsAsRead,
  Medication,
} from "../../utils/storage";

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

type ScheduledDose = TimelineDose;

interface NotificationItem extends ScheduledDose {
  isRead: boolean;
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
  const [totalScheduledDoses, setTotalScheduledDoses] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [nextDueDose, setNextDueDose] = useState<ScheduledDose | undefined>();
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const showFeedback = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const loadTimeline = useCallback(async () => {
    try {
      const timeline = await todayTimelineService.getForToday();
      setScheduledDoses(timeline.items);
      setCompletedDoses(timeline.completedScheduled);
      setTotalScheduledDoses(timeline.totalScheduled);
      setOverdueCount(timeline.overdueCount);
      setNextDueDose(timeline.nextDueDose);
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
    loadTimeline();
    setupNotifications();

    // Handle app state changes for notifications
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        loadTimeline();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadTimeline, setupNotifications]);

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

      loadTimeline();
      loadReadNotifications();
      return () => unsubscribe();
    }, [loadTimeline, loadReadNotifications]),
  );

  const handleTakeDose = async (
    medication: Medication,
    scheduledTime?: string,
  ) => {
    try {
      if (scheduledTime) {
        await doseService.recordScheduledDose(medication.id, scheduledTime);
      } else {
        await doseService.recordAsNeededDose(medication.id);
      }
      await loadTimeline(); // Reload timeline after recording dose
      showFeedback(`Marked ${medication.name} as taken`);
    } catch (error) {
      console.error("Error recording dose:", error);
      Alert.alert("Error", "Failed to record dose. Please try again.");
    }
  };

  const handleSkipDose = async (
    medication: Medication,
    scheduledTime?: string,
  ) => {
    try {
      if (scheduledTime) {
        await doseService.skipScheduledDose(medication.id, scheduledTime);
      } else {
        await doseService.skipAsNeededDose(medication.id);
      }
      await loadTimeline();
      showFeedback(`Skipped ${medication.name} for this slot`);
    } catch (error) {
      console.error("Error skipping dose:", error);
      Alert.alert("Error", "Failed to skip dose. Please try again.");
    }
  };

  const confirmSkipDose = (medication: Medication, scheduledTime?: string) => {
    const whenText = scheduledTime ? ` at ${scheduledTime}` : "";
    Alert.alert(
      "Skip dose?",
      `Mark ${medication.name}${whenText} as skipped for now?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          style: "destructive",
          onPress: () => {
            void handleSkipDose(medication, scheduledTime);
          },
        },
      ],
    );
  };

  const notificationItems: NotificationItem[] =
    todayTimelineService.getNotificationReadState(
      scheduledDoses,
      readNotificationIds,
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
    <View style={styles.root}>
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
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="white"
                />
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
                    <Text style={styles.overdueText}>
                      {overdueCount} overdue
                    </Text>
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
                  <TouchableOpacity
                    style={styles.focusSkipButton}
                    onPress={() =>
                      confirmSkipDose(
                        nextDueDose.medication,
                        nextDueDose.scheduledTime,
                      )
                    }
                  >
                    <Text style={styles.focusSkipText}>Skip for now</Text>
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
                          <Ionicons
                            name={action.icon}
                            size={28}
                            color="white"
                          />
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
                <Text style={styles.emptyStateTitle}>
                  Nothing scheduled yet
                </Text>
                <Text style={styles.emptyStateText}>
                  Add your first medication to start daily reminders and
                  tracking.
                </Text>
                <View style={styles.emptyActionsRow}>
                  <Link href="/medications/add" asChild>
                    <TouchableOpacity style={styles.addMedicationButton}>
                      <Text style={styles.addMedicationButtonText}>
                        Add Medication
                      </Text>
                    </TouchableOpacity>
                  </Link>
                  <Link href="/medications" asChild>
                    <TouchableOpacity style={styles.secondaryEmptyButton}>
                      <Text style={styles.secondaryEmptyButtonText}>
                        Open List
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            ) : (
              scheduledDoses.map((doseItem) => {
                const { medication, scheduledTime, timeLabel } = doseItem;
                const taken = doseItem.taken;
                const isOverdue = doseItem.isOverdue;
                const isSkipped = doseItem.status === "skipped";
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
                        <Text style={styles.medicineName}>
                          {medication.name}
                        </Text>
                        <Text style={styles.dosageInfo}>
                          {medication.dosage}
                        </Text>
                      </View>
                      <View style={styles.doseTime}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={SkeuoTheme.colors.textSecondary}
                        />
                        <Text style={styles.timeText}>{timeLabel}</Text>
                      </View>
                      {!doseItem.isResolved && (
                        <View style={styles.inlineStatusWrap}>
                          <StatusBadge
                            status={
                              scheduledTime
                                ? isOverdue
                                  ? "overdue"
                                  : "upcoming"
                                : "upcoming"
                            }
                            compact
                          />
                        </View>
                      )}
                    </View>
                    {taken ? (
                      <StatusBadge status="taken" />
                    ) : isSkipped ? (
                      <StatusBadge status="skipped" />
                    ) : (
                      <View style={styles.doseActionsRow}>
                        <TouchableOpacity
                          style={[
                            styles.skipDoseButton,
                            { borderColor: medication.color },
                          ]}
                          onPress={() =>
                            confirmSkipDose(medication, scheduledTime)
                          }
                        >
                          <Text
                            style={[
                              styles.skipDoseText,
                              { color: medication.color },
                            ]}
                          >
                            Skip
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.takeDoseButton,
                            { backgroundColor: medication.color },
                          ]}
                          onPress={() =>
                            handleTakeDose(medication, scheduledTime)
                          }
                        >
                          <Text style={styles.takeDoseText}>
                            {scheduledTime ? "Take" : "Log"}
                          </Text>
                        </TouchableOpacity>
                      </View>
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
                    {unreadNotificationCount} unread of{" "}
                    {notificationItems.length}
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
                    <View style={styles.notificationMetaWrap}>
                      {doseItem.scheduledTime ? (
                        <StatusBadge
                          status={doseItem.isOverdue ? "overdue" : "upcoming"}
                          compact
                        />
                      ) : (
                        <Text style={styles.notificationMeta}>As needed</Text>
                      )}
                    </View>
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
      <FeedbackSnackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        onHide={() => setSnackbarVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
  focusSkipButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.accent,
    borderRadius: SkeuoTheme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: SkeuoTheme.colors.cardBackground,
  },
  focusSkipText: {
    color: SkeuoTheme.colors.accentDark,
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
  inlineStatusWrap: {
    marginTop: 6,
  },
  takeDoseButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  doseActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    gap: 8,
  },
  skipDoseButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
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
  skippedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SkeuoTheme.radius.pill,
  },
  skippedText: {
    color: SkeuoTheme.colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 4,
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
  notificationMetaWrap: {
    marginTop: 2,
    marginBottom: 2,
    alignSelf: "flex-start",
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
    marginBottom: 16,
    textAlign: "center",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
    marginTop: 12,
  },
  emptyActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  addMedicationButton: {
    backgroundColor: SkeuoTheme.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  secondaryEmptyButton: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
  },
  addMedicationButtonText: {
    color: "white",
    fontWeight: "600",
  },
  secondaryEmptyButtonText: {
    color: SkeuoTheme.colors.textPrimary,
    fontWeight: "600",
  },
});
