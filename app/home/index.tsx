import { FeedbackSnackbar } from "@/components/ui/feedback-snackbar";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getDoseFailureAlert,
  getDoseSuccessMessage,
  getSkipConfirmationCopy,
} from "@/constants/feedback-copy";
import { doseService } from "@/services/dose-service";
import { todayTimelineService } from "@/services/today-timeline-service";
import { TimelineDose } from "@/shared/utils/dose-timeline";
import { triggerLightHaptic } from "@/utils/haptics";
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
    label: "Create\nMedication",
    route: "/medications" as const,
    color: "#0b87ab",
    gradient: ["#148bb7", "#0c6f97"] as [string, string],
  },
  {
    icon: "calendar-outline" as const,
    label: "Calendar\nPlanner",
    route: "/calendar" as const,
    color: "#3a76dc",
    gradient: ["#548df0", "#346fcf"] as [string, string],
  },
  {
    icon: "time-outline" as const,
    label: "History\nAnalytics",
    route: "/history" as const,
    color: "#b97a00",
    gradient: ["#d18f1a", "#a66a00"] as [string, string],
  },
  {
    icon: "medical-outline" as const,
    label: "Inventory\nRefills",
    route: "/refills" as const,
    color: "#247b8f",
    gradient: ["#3498b0", "#1d6f84"] as [string, string],
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
          stroke="rgba(15, 143, 174, 0.22)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={SkeuoTheme.colors.accentDark}
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
      void triggerLightHaptic();
      showFeedback(getDoseSuccessMessage("take", medication.name));
    } catch (error) {
      console.error("Error recording dose:", error);
      const failure = getDoseFailureAlert("take");
      Alert.alert(failure.title, failure.message);
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
      void triggerLightHaptic();
      showFeedback(getDoseSuccessMessage("skip", medication.name));
    } catch (error) {
      console.error("Error skipping dose:", error);
      const failure = getDoseFailureAlert("skip");
      Alert.alert(failure.title, failure.message);
    }
  };

  const confirmSkipDose = (medication: Medication, scheduledTime?: string) => {
    const copy = getSkipConfirmationCopy(medication.name, scheduledTime);
    Alert.alert(copy.title, copy.message, [
      { text: copy.cancelLabel, style: "cancel" },
      {
        text: copy.confirmLabel,
        style: "destructive",
        onPress: () => {
          void handleSkipDose(medication, scheduledTime);
        },
      },
    ]);
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
      <LinearGradient
        colors={[
          SkeuoTheme.colors.headerGradientStart,
          SkeuoTheme.colors.headerGradientEnd,
        ]}
        style={[styles.heroGradient, { height: insets.top + 230 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={[
            SkeuoTheme.colors.headerGradientStart,
            SkeuoTheme.colors.headerGradientEnd,
          ]}
          style={[styles.header, { paddingTop: insets.top + 10 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
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
            <View style={styles.heroSummaryRow}>
              <View style={styles.heroSummaryItem}>
                <Text style={styles.heroSummaryValue}>
                  {totalScheduledDoses}
                </Text>
                <Text style={styles.heroSummaryLabel}>Scheduled</Text>
              </View>
              <View style={styles.heroSummaryDivider} />
              <View style={styles.heroSummaryItem}>
                <Text style={styles.heroSummaryValue}>{completedDoses}</Text>
                <Text style={styles.heroSummaryLabel}>Completed</Text>
              </View>
              <View style={styles.heroSummaryDivider} />
              <View style={styles.heroSummaryItem}>
                <Text style={styles.heroSummaryValue}>{overdueCount}</Text>
                <Text style={styles.heroSummaryLabel}>Overdue</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.progressSection}>
            <View style={styles.progressCard}>
              <Text style={styles.progressCardTitle}>Today Progress</Text>
              <CircularProgress
                progress={progress}
                totalDoses={totalScheduledDoses}
                completedDoses={completedDoses}
              />
            </View>
          </View>

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
                  <View style={styles.focusButtonsRow}>
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
                  </View>
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
            <View style={styles.sectionHeaderBar}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.quickActionsGrid}>
              {QUICK_ACTIONS.map((action) => (
                <Link href={action.route as any} key={action.label} asChild>
                  <TouchableOpacity style={styles.actionButton}>
                    <LinearGradient
                      colors={action.gradient}
                      style={styles.actionGradient}
                    >
                      <View style={styles.actionContent}>
                        <View style={[styles.actionIcon]}>
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
                <TouchableOpacity style={styles.seeAllButtonWrap}>
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
                    <View style={styles.doseCardTop}>
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

          <View style={styles.creditWrap}>
            <View style={styles.creditBadge}>
              <Ionicons
                name="code-working-outline"
                size={14}
                color={SkeuoTheme.colors.accentDark}
              />
              <Text style={styles.creditText}>develeopd by :Shadi Sbaih</Text>
            </View>
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
    backgroundColor: SkeuoTheme.colors.pageBackground,
  },
  heroGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 18,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginHorizontal: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    ...SkeuoTheme.shadow.outer,
  },
  headerContent: {
    paddingHorizontal: 18,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 14,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "700",
    color: SkeuoTheme.colors.white,
    opacity: 0.95,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  greetingSub: {
    marginTop: 4,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.96)",
    fontWeight: "700",
    maxWidth: "95%",
  },
  heroSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  heroSummaryItem: {
    flex: 1,
    paddingVertical: 4,
    alignItems: "center",
  },
  heroSummaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  heroSummaryValue: {
    color: SkeuoTheme.colors.white,
    fontSize: 18,
    fontWeight: "800",
  },
  heroSummaryLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: 1,
  },
  content: {
    flex: 1,
    paddingTop: 14,
  },
  progressSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 20,
    paddingVertical: 10,
  },
  progressCardTitle: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: SkeuoTheme.colors.textSecondary,
    marginBottom: 8,
  },
  focusSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  focusCard: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 18,
    ...SkeuoTheme.shadow.outerSoft,
  },
  focusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  focusTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
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
    fontSize: 21,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 3,
  },
  focusMeta: {
    fontSize: 15,
    color: SkeuoTheme.colors.textSecondary,
    marginBottom: 12,
  },
  focusButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  focusActionButton: {
    flex: 1,
    backgroundColor: SkeuoTheme.colors.accent,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 48,
  },
  focusActionText: {
    color: SkeuoTheme.colors.white,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  focusSkipButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    alignItems: "center",
    minHeight: 48,
  },
  focusSkipText: {
    color: SkeuoTheme.colors.accentDark,
    fontSize: 13,
    fontWeight: "700",
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeaderBar: {
    marginBottom: 8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    width: (width - 48) / 2,
    height: 116,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    ...SkeuoTheme.shadow.outerSoft,
  },
  actionGradient: {
    flex: 1,
    padding: 14,
  },
  actionContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "white",
    marginTop: 6,
    lineHeight: 18,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
  },
  seeAllButtonWrap: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SkeuoTheme.radius.pill,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
  },
  seeAllButton: {
    color: SkeuoTheme.colors.accent,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  doseCard: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 14,
    marginBottom: 10,
    ...SkeuoTheme.shadow.outerSoft,
  },
  doseCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  doseBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  doseInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  medicineName: {
    fontSize: 17,
    fontWeight: "800",
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
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    minHeight: 40,
    justifyContent: "center",
  },
  doseActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  skipDoseButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    minHeight: 40,
    justifyContent: "center",
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
    marginVertical: 2,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  progressTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  progressPercentage: {
    fontSize: 34,
    fontWeight: "800",
    color: SkeuoTheme.colors.accentDark,
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
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
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
    fontSize: 13,
    color: SkeuoTheme.colors.textSecondary,
    fontWeight: "600",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: SkeuoTheme.colors.overlayDark,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "82%",
    borderTopWidth: 1,
    borderColor: SkeuoTheme.colors.border,
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
    padding: 24,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
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
    marginTop: 6,
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
  creditWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    alignItems: "center",
  },
  creditBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: SkeuoTheme.radius.pill,
  },
  creditText: {
    color: SkeuoTheme.colors.accentDark,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
