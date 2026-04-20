import { FeedbackSnackbar } from "@/components/ui/feedback-snackbar";
import { getEditOpenMessage } from "@/constants/feedback-copy";
import { todayTimelineService } from "@/services";
import { TimelineDose } from "@/shared/utils/dose-timeline";
import {
    type MedicationEntity,
    useMedicationStore,
} from "@/stores/medication-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { triggerLightHaptic } from "@/utils/haptics";
import { AppIcon } from "@/components/ui/app-icon";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
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

export default function MedicationDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const loadMedications = useMedicationStore((state) => state.loadMedications);
  const loadTodayTimeline = useTimelineStore((state) => state.loadToday);

  const [medication, setMedication] = useState<MedicationEntity | null>(null);
  const [todayItems, setTodayItems] = useState<TimelineDose[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const showFeedback = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;

    await Promise.all([loadMedications(), loadTodayTimeline()]);

    const med = useMedicationStore
      .getState()
      .medications.find((item) => item.id === id);

    if (!med) {
      Alert.alert("Not found", "Medication was not found.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }

    setMedication(med);

    const group = todayTimelineService
      .groupByMedication(useTimelineStore.getState().items)
      .find((item) => item.medication.id === med.id);
    setTodayItems(group?.items ?? []);
  }, [id, loadMedications, loadTodayTimeline, router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  if (!medication) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading medication...</Text>
      </View>
    );
  }

  const totalSupply = Math.max(1, medication.totalSupply || 0);
  const supplyPercent = Math.min(
    100,
    Math.max(0, (medication.currentSupply / totalSupply) * 100),
  );
  const lowStock =
    medication.refillReminder &&
    medication.currentSupply <= medication.refillAt;

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
            <AppIcon
              name="chevron-back"
              size={28}
              color={SkeuoTheme.colors.accentDark}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medication Details</Text>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryStrip}>
            <View style={styles.summaryStripItem}>
              <Text style={styles.summaryStripValue}>
                {medication.frequency}
              </Text>
              <Text style={styles.summaryStripLabel}>Frequency</Text>
            </View>
            <View style={styles.summaryStripItem}>
              <Text style={styles.summaryStripValue}>{todayItems.length}</Text>
              <Text style={styles.summaryStripLabel}>Today Doses</Text>
            </View>
            <View style={styles.summaryStripItem}>
              <Text style={styles.summaryStripValue}>
                {Math.max(0, medication.currentSupply)}
              </Text>
              <Text style={styles.summaryStripLabel}>In Stock</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.titleRow}>
              <View
                style={[
                  styles.colorPill,
                  { backgroundColor: medication.color },
                ]}
              />
              <View style={styles.titleTextWrap}>
                <Text style={styles.name}>{medication.name}</Text>
                <Text style={styles.dosage}>{medication.dosage}</Text>
              </View>
            </View>

            <View style={styles.chipsRow}>
              <View style={styles.chip}>
                <AppIcon
                  name="time-outline"
                  size={14}
                  color={SkeuoTheme.colors.textSecondary}
                />
                <Text style={styles.chipText}>{medication.frequency}</Text>
              </View>
              <View style={styles.chip}>
                <AppIcon
                  name={
                    medication.reminderEnabled
                      ? "notifications-outline"
                      : "notifications-off-outline"
                  }
                  size={14}
                  color={SkeuoTheme.colors.textSecondary}
                />
                <Text style={styles.chipText}>
                  {medication.reminderEnabled
                    ? "Reminders On"
                    : "Reminders Off"}
                </Text>
              </View>
            </View>

            <Text style={styles.metaText}>
              Starts {new Date(medication.startDate).toLocaleDateString()} •{" "}
              {medication.duration}
            </Text>
            {medication.notes ? (
              <Text style={styles.notesText}>{medication.notes}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.supplyHeaderRow}>
              <Text style={styles.sectionTitle}>Supply</Text>
              {lowStock ? (
                <Text style={styles.lowStockText}>Low stock</Text>
              ) : null}
            </View>
            <Text style={styles.supplyLabel}>
              {medication.currentSupply}/{medication.totalSupply}
            </Text>
            <View style={styles.supplyTrack}>
              <View
                style={[
                  styles.supplyFill,
                  {
                    width: `${supplyPercent}%`,
                    backgroundColor: lowStock
                      ? SkeuoTheme.colors.danger
                      : SkeuoTheme.colors.accent,
                  },
                ]}
              />
            </View>
            {medication.refillReminder ? (
              <Text style={styles.metaText}>
                Refill alert at {medication.refillAt}
              </Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Today</Text>
            {todayItems.length === 0 ? (
              <Text style={styles.metaText}>No doses scheduled today.</Text>
            ) : (
              todayItems.map((item) => (
                <View key={item.id} style={styles.todayRow}>
                  <View>
                    <Text style={styles.todayTime}>{item.timeLabel}</Text>
                    <Text style={styles.todayState}>
                      {item.taken
                        ? "Taken"
                        : item.status === "skipped"
                          ? "Skipped"
                          : item.scheduledTime
                            ? item.isOverdue
                              ? "Overdue"
                              : "Upcoming"
                            : "As needed"}
                    </Text>
                  </View>
                  <AppIcon
                    name={
                      item.taken
                        ? "checkmark-circle"
                        : item.status === "skipped"
                          ? "play-skip-forward-circle"
                          : "ellipse-outline"
                    }
                    size={18}
                    color={
                      item.taken
                        ? SkeuoTheme.colors.success
                        : item.status === "skipped"
                          ? SkeuoTheme.colors.textTertiary
                          : SkeuoTheme.colors.textSecondary
                    }
                  />
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              void triggerLightHaptic();
              showFeedback(getEditOpenMessage(medication.name));
              setTimeout(() => {
                router.push({
                  pathname: "/medications/add",
                  params: { medicationId: medication.id },
                });
              }, 120);
            }}
          >
            <Text style={styles.editButtonText}>Edit Medication</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FeedbackSnackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type="info"
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
  loadingText: {
    marginTop: 60,
    textAlign: "center",
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 16,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    minHeight: 56,
    paddingBottom: 16,
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
    ...SkeuoTheme.shadow.outerSoft,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "white",
    marginLeft: 15,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryStrip: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  summaryStripItem: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    paddingVertical: 10,
    alignItems: "center",
    ...SkeuoTheme.shadow.outerSoft,
  },
  summaryStripValue: {
    color: SkeuoTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  summaryStripLabel: {
    marginTop: 2,
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.25,
  },
  card: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 18,
    marginBottom: 12,
    ...SkeuoTheme.shadow.outerSoft,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorPill: {
    width: 12,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  titleTextWrap: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
  },
  dosage: {
    marginTop: 2,
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    marginTop: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  chipText: {
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  metaText: {
    marginTop: 10,
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  notesText: {
    marginTop: 8,
    color: SkeuoTheme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
  },
  supplyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  supplyLabel: {
    marginTop: 8,
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  lowStockText: {
    color: SkeuoTheme.colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  supplyTrack: {
    marginTop: 11,
    height: 10,
    borderRadius: 999,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    overflow: "hidden",
  },
  supplyFill: {
    height: "100%",
    borderRadius: 999,
  },
  todayRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: SkeuoTheme.colors.border,
  },
  todayTime: {
    color: SkeuoTheme.colors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  todayState: {
    marginTop: 2,
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 13,
  },
  footer: {
    padding: 20,
    backgroundColor: SkeuoTheme.colors.pageBackground,
    borderTopWidth: 1,
    borderTopColor: SkeuoTheme.colors.border,
  },
  editButton: {
    backgroundColor: SkeuoTheme.colors.accent,
    borderRadius: 18,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    ...SkeuoTheme.shadow.outerSoft,
  },
  editButtonText: {
    color: SkeuoTheme.colors.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.25,
  },
});
