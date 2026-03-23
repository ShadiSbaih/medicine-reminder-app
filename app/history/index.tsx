import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SkeuoTheme } from "../../constants/theme";
import {
    DoseHistory,
    Medication,
    clearAllData,
    getDoseHistory,
    getDoseStatus,
    getMedications,
} from "../../utils/storage";

type EnrichedDoseHistory = DoseHistory & { medication?: Medication };
type TimeFilter = "all" | "today" | "7d" | "30d";
type StatusFilter = "all" | "taken" | "missed" | "skipped";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [history, setHistory] = useState<EnrichedDoseHistory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      const [doseHistory, medications] = await Promise.all([
        getDoseHistory(),
        getMedications(),
      ]);

      // Combine history with medication details
      const enrichedHistory = doseHistory.map((dose) => ({
        ...dose,
        medication: medications.find((med) => med.id === dose.medicationId),
      }));

      setHistory(enrichedHistory);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const groupHistoryByDate = (source: EnrichedDoseHistory[]) => {
    const grouped = source.reduce(
      (acc, dose) => {
        const date = new Date(dose.timestamp).toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(dose);
        return acc;
      },
      {} as Record<string, EnrichedDoseHistory[]>,
    );

    return Object.entries(grouped).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
    );
  };

  const filteredHistory = history
    .filter((dose) => {
      const doseDate = new Date(dose.timestamp);
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const thirtyDaysAgo = new Date(startOfToday);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

      const isInTimeWindow =
        timeFilter === "all"
          ? true
          : timeFilter === "today"
            ? doseDate >= startOfToday
            : timeFilter === "7d"
              ? doseDate >= sevenDaysAgo
              : doseDate >= thirtyDaysAgo;

      if (!isInTimeWindow) return false;

      if (selectedFilter === "all") return true;
      if (selectedFilter === "taken") return getDoseStatus(dose) === "taken";
      if (selectedFilter === "missed") return getDoseStatus(dose) === "missed";
      if (selectedFilter === "skipped") {
        return getDoseStatus(dose) === "skipped";
      }
      return true;
    })
    .filter((dose) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      const name = dose.medication?.name?.toLowerCase() ?? "";
      const dosage = dose.medication?.dosage?.toLowerCase() ?? "";
      const scheduled = dose.scheduledTime?.toLowerCase() ?? "";
      return (
        name.includes(query) ||
        dosage.includes(query) ||
        scheduled.includes(query)
      );
    });

  const groupedHistory = groupHistoryByDate(filteredHistory);
  const totalCount = filteredHistory.length;
  const takenCount = filteredHistory.filter(
    (dose) => getDoseStatus(dose) === "taken",
  ).length;
  const missedCount = filteredHistory.filter(
    (dose) => getDoseStatus(dose) === "missed",
  ).length;
  const skippedCount = filteredHistory.filter(
    (dose) => getDoseStatus(dose) === "skipped",
  ).length;

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadHistory();
    } finally {
      setRefreshing(false);
    }
  }, [loadHistory]);

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to clear all medication data? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllData();
              await loadHistory();
              Alert.alert("Success", "All data has been cleared successfully");
            } catch (error) {
              console.error("Error clearing data:", error);
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          },
        },
      ],
    );
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
          <Text style={styles.headerTitle}>History Log</Text>
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "all" && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter("all")}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "all" && styles.filterTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "taken" && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter("taken")}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "taken" && styles.filterTextActive,
                ]}
              >
                Taken
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "missed" && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter("missed")}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "missed" && styles.filterTextActive,
                ]}
              >
                Missed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "skipped" && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter("skipped")}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "skipped" && styles.filterTextActive,
                ]}
              >
                Skipped
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.searchRow}>
            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search-outline"
                size={18}
                color={SkeuoTheme.colors.textSecondary}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by medication or dosage"
                placeholderTextColor={SkeuoTheme.colors.textTertiary}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={SkeuoTheme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: "all", label: "All Time" },
              { key: "today", label: "Today" },
              { key: "7d", label: "7 Days" },
              { key: "30d", label: "30 Days" },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.timeChip,
                  timeFilter === item.key && styles.timeChipActive,
                ]}
                onPress={() => setTimeFilter(item.key as TimeFilter)}
              >
                <Text
                  style={[
                    styles.timeChipText,
                    timeFilter === item.key && styles.timeChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalCount}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardTaken]}>
            <Text style={[styles.summaryValue, styles.summaryValueTaken]}>
              {takenCount}
            </Text>
            <Text style={[styles.summaryLabel, styles.summaryLabelTaken]}>
              Taken
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardMissed]}>
            <Text style={[styles.summaryValue, styles.summaryValueMissed]}>
              {missedCount}
            </Text>
            <Text style={[styles.summaryLabel, styles.summaryLabelMissed]}>
              Missed
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardSkipped]}>
            <Text style={[styles.summaryValue, styles.summaryValueSkipped]}>
              {skippedCount}
            </Text>
            <Text style={[styles.summaryLabel, styles.summaryLabelSkipped]}>
              Skipped
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.historyContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={SkeuoTheme.colors.accent}
            />
          }
        >
          {groupedHistory.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={SkeuoTheme.colors.textTertiary}
              />
              <Text style={styles.emptyStateTitle}>No history found</Text>
              <Text style={styles.emptyStateMessage}>
                {selectedFilter === "all" && !searchQuery
                  ? "Your dose activity will appear here once you start logging medications."
                  : "No records match your current filters."}
              </Text>
            </View>
          )}

          {groupedHistory.map(([date, doses]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>
                {new Date(date).toLocaleDateString("default", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
              {doses.map((dose) => (
                <View key={dose.id} style={styles.historyCard}>
                  <View
                    style={[
                      styles.medicationColor,
                      {
                        backgroundColor:
                          dose.medication?.color ||
                          SkeuoTheme.colors.textTertiary,
                      },
                    ]}
                  />
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>
                      {dose.medication?.name || "Unknown Medication"}
                    </Text>
                    <Text style={styles.medicationDosage}>
                      {dose.medication?.dosage}
                    </Text>
                    <Text style={styles.timeText}>
                      {new Date(dose.timestamp).toLocaleTimeString("default", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {dose.scheduledTime && (
                      <Text style={styles.scheduledText}>
                        Scheduled {dose.scheduledTime}
                      </Text>
                    )}
                  </View>
                  <View style={styles.statusContainer}>
                    {getDoseStatus(dose) === "taken" && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: SkeuoTheme.colors.successSurface },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={SkeuoTheme.colors.success}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: SkeuoTheme.colors.success },
                          ]}
                        >
                          Taken
                        </Text>
                      </View>
                    )}
                    {getDoseStatus(dose) === "missed" && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: SkeuoTheme.colors.dangerSurface },
                        ]}
                      >
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color={SkeuoTheme.colors.danger}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: SkeuoTheme.colors.danger },
                          ]}
                        >
                          Missed
                        </Text>
                      </View>
                    )}
                    {getDoseStatus(dose) === "skipped" && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: SkeuoTheme.colors.neutralSurface },
                        ]}
                      >
                        <Ionicons
                          name="play-skip-forward-circle"
                          size={16}
                          color={SkeuoTheme.colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: SkeuoTheme.colors.textSecondary },
                          ]}
                        >
                          Skipped
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.clearDataContainer}>
            <TouchableOpacity
              style={styles.clearDataButton}
              onPress={handleClearAllData}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={SkeuoTheme.colors.danger}
              />
              <Text style={styles.clearDataText}>Clear All Data</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
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
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: SkeuoTheme.colors.pageBackground,
    paddingTop: 10,
  },
  filtersScroll: {
    paddingRight: 20,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    marginRight: 10,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: SkeuoTheme.colors.accent,
    borderColor: SkeuoTheme.colors.accent,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: SkeuoTheme.colors.textSecondary,
  },
  filterTextActive: {
    color: "white",
  },
  searchRow: {
    marginTop: 10,
    marginBottom: 10,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: SkeuoTheme.colors.textPrimary,
  },
  timeChip: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 2,
  },
  timeChipActive: {
    backgroundColor: SkeuoTheme.colors.accent,
    borderColor: SkeuoTheme.colors.accent,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: SkeuoTheme.colors.textSecondary,
  },
  timeChipTextActive: {
    color: SkeuoTheme.colors.white,
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: SkeuoTheme.colors.pageBackground,
  },
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  summaryCardTaken: {
    backgroundColor: SkeuoTheme.colors.successSurface,
  },
  summaryCardMissed: {
    backgroundColor: SkeuoTheme.colors.dangerSurface,
  },
  summaryCardSkipped: {
    backgroundColor: SkeuoTheme.colors.neutralSurface,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
  },
  summaryValueTaken: {
    color: SkeuoTheme.colors.success,
  },
  summaryValueMissed: {
    color: SkeuoTheme.colors.danger,
  },
  summaryValueSkipped: {
    color: SkeuoTheme.colors.textSecondary,
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: SkeuoTheme.colors.textSecondary,
  },
  summaryLabelTaken: {
    color: SkeuoTheme.colors.success,
  },
  summaryLabelMissed: {
    color: SkeuoTheme.colors.danger,
  },
  summaryLabelSkipped: {
    color: SkeuoTheme.colors.textSecondary,
  },
  emptyState: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 24,
    alignItems: "center",
    marginBottom: 18,
  },
  emptyStateTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
  },
  emptyStateMessage: {
    marginTop: 8,
    fontSize: 14,
    color: SkeuoTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  dateGroup: {
    marginBottom: 25,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: SkeuoTheme.colors.textSecondary,
    marginBottom: 12,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 16,
    padding: 16,
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
    marginRight: 16,
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
  timeText: {
    fontSize: 14,
    color: SkeuoTheme.colors.textSecondary,
  },
  scheduledText: {
    fontSize: 12,
    color: SkeuoTheme.colors.textTertiary,
    marginTop: 2,
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
  },
  clearDataContainer: {
    padding: 20,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  clearDataButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.dangerSurface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.dangerBorder,
  },
  clearDataText: {
    color: SkeuoTheme.colors.danger,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
