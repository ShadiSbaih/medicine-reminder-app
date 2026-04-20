import {
  HistoryFilters,
  type HistoryStatusFilter,
  type HistoryTimeFilter,
} from "@/components/history/history-filters";
import { HistoryHeader } from "@/components/history/history-header";
import { HistorySummary } from "@/components/history/history-summary";
import { HistoryTimeline } from "@/components/history/history-timeline";
import {
  getClearAllConfirmationAlert,
  getClearAllFailureAlert,
  getClearAllSuccessAlert,
} from "@/constants/feedback-copy";
import {
  type EnrichedDoseHistory,
  useHistoryStore,
} from "@/stores/history-store";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SkeuoTheme } from "../../constants/theme";

type DoseStatus = "taken" | "missed" | "skipped";

function groupHistoryByDate(source: EnrichedDoseHistory[]) {
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
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const history = useHistoryStore((state) => state.records);
  const loadHistory = useHistoryStore((state) => state.loadHistory);
  const clearHistory = useHistoryStore((state) => state.clearHistory);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] =
    useState<HistoryStatusFilter>("all");
  const [timeFilter, setTimeFilter] = useState<HistoryTimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const resolveDoseStatus = useCallback(
    (dose: Pick<EnrichedDoseHistory, "status" | "taken">): DoseStatus => {
      if (
        dose.status === "taken" ||
        dose.status === "missed" ||
        dose.status === "skipped"
      ) {
        return dose.status;
      }

      return dose.taken ? "taken" : "missed";
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      loadHistory().catch((error) => {
        console.error("Error loading history:", error);
      });
    }, [loadHistory]),
  );

  const filteredHistory = useMemo(() => {
    return history
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

        if (!isInTimeWindow) {
          return false;
        }

        if (selectedFilter === "all") {
          return true;
        }

        return resolveDoseStatus(dose) === selectedFilter;
      })
      .filter((dose) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
          return true;
        }

        const name = dose.medication?.name?.toLowerCase() ?? "";
        const dosage = dose.medication?.dosage?.toLowerCase() ?? "";
        const scheduled = dose.scheduledTime?.toLowerCase() ?? "";

        return (
          name.includes(query) ||
          dosage.includes(query) ||
          scheduled.includes(query)
        );
      });
  }, [history, resolveDoseStatus, searchQuery, selectedFilter, timeFilter]);

  const groupedHistory = useMemo(
    () => groupHistoryByDate(filteredHistory),
    [filteredHistory],
  );

  const { totalCount, takenCount, missedCount, skippedCount } = useMemo(() => {
    return {
      totalCount: filteredHistory.length,
      takenCount: filteredHistory.filter(
        (dose) => resolveDoseStatus(dose) === "taken",
      ).length,
      missedCount: filteredHistory.filter(
        (dose) => resolveDoseStatus(dose) === "missed",
      ).length,
      skippedCount: filteredHistory.filter(
        (dose) => resolveDoseStatus(dose) === "skipped",
      ).length,
    };
  }, [filteredHistory, resolveDoseStatus]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadHistory();
    } catch (error) {
      console.error("Error refreshing history:", error);
    }
    setRefreshing(false);
  }, [loadHistory]);

  const handleClearAllData = useCallback(() => {
    const copy = getClearAllConfirmationAlert();
    Alert.alert(copy.title, copy.message, [
      {
        text: copy.cancelLabel,
        style: "cancel",
      },
      {
        text: copy.confirmLabel,
        style: "destructive",
        onPress: async () => {
          try {
            await clearHistory();
            const success = getClearAllSuccessAlert();
            Alert.alert(success.title, success.message);
          } catch (error) {
            console.error("Error clearing data:", error);
            const failure = getClearAllFailureAlert();
            Alert.alert(failure.title, failure.message);
          }
        },
      },
    ]);
  }, [clearHistory]);

  const resetFilters = useCallback(() => {
    setSelectedFilter("all");
    setTimeFilter("all");
    setSearchQuery("");
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleGoAddMedication = useCallback(() => {
    router.push("/medications/add");
  }, [router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          SkeuoTheme.colors.headerGradientStart,
          SkeuoTheme.colors.headerGradientEnd,
        ]}
        style={[styles.headerGradient, { height: insets.top + 220 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      <View style={[styles.content, { paddingTop: insets.top + 6 }]}>
        <HistoryHeader onBack={handleBack} />

        <HistoryFilters
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
          timeFilter={timeFilter}
          onSelectTimeFilter={setTimeFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />

        <HistorySummary
          totalCount={totalCount}
          takenCount={takenCount}
          missedCount={missedCount}
          skippedCount={skippedCount}
        />

        <HistoryTimeline
          groupedHistory={groupedHistory}
          selectedFilter={selectedFilter}
          searchQuery={searchQuery}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onResetFilters={resetFilters}
          onGoAddMedication={handleGoAddMedication}
          onClearAllData={handleClearAllData}
          resolveDoseStatus={resolveDoseStatus}
        />
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
    height: 180,
  },
  content: {
    flex: 1,
    paddingTop: 0,
  },
});
