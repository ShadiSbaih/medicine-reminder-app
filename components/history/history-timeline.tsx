import { HistoryStatusFilter } from "@/components/history/history-filters";
import { AppIcon } from "@/components/ui/app-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { SkeuoTheme } from "@/constants/theme";
import { type EnrichedDoseHistory } from "@/stores/history-store";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type DoseStatus = "taken" | "missed" | "skipped";

interface HistoryTimelineProps {
  groupedHistory: [string, EnrichedDoseHistory[]][];
  selectedFilter: HistoryStatusFilter;
  searchQuery: string;
  refreshing: boolean;
  onRefresh: () => void;
  onResetFilters: () => void;
  onGoAddMedication: () => void;
  onClearAllData: () => void;
  resolveDoseStatus: (
    dose: Pick<EnrichedDoseHistory, "status" | "taken">,
  ) => DoseStatus;
}

export function HistoryTimeline({
  groupedHistory,
  selectedFilter,
  searchQuery,
  refreshing,
  onRefresh,
  onResetFilters,
  onGoAddMedication,
  onClearAllData,
  resolveDoseStatus,
}: HistoryTimelineProps) {
  const shouldShowAddMedication = selectedFilter === "all" && !searchQuery;

  return (
    <ScrollView
      style={styles.historyContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={SkeuoTheme.colors.accent}
        />
      }
    >
      {groupedHistory.length === 0 && (
        <View style={styles.emptyState}>
          <AppIcon
            name="document-text-outline"
            size={48}
            color={SkeuoTheme.colors.textTertiary}
          />
          <Text style={styles.emptyStateTitle}>No history found</Text>
          <Text style={styles.emptyStateMessage}>
            {shouldShowAddMedication
              ? "Your dose activity will appear here once you start logging medications."
              : "No records match your current filters."}
          </Text>
          {shouldShowAddMedication ? (
            <TouchableOpacity
              style={styles.emptyStatePrimaryButton}
              onPress={onGoAddMedication}
            >
              <Text style={styles.emptyStatePrimaryButtonText}>
                Add Medication
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.emptyStateSecondaryButton}
              onPress={onResetFilters}
            >
              <Text style={styles.emptyStateSecondaryButtonText}>
                Reset Filters
              </Text>
            </TouchableOpacity>
          )}
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
          {doses.map((dose) => {
            const status = resolveDoseStatus(dose);
            return (
              <View key={dose.id} style={styles.historyCard}>
                <View
                  style={[
                    styles.medicationColor,
                    {
                      backgroundColor:
                        dose.medication?.color || SkeuoTheme.colors.textTertiary,
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
                  {status === "taken" && <StatusBadge status="taken" />}
                  {status === "missed" && <StatusBadge status="missed" />}
                  {status === "skipped" && <StatusBadge status="skipped" />}
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.clearDataContainer}>
        <TouchableOpacity style={styles.clearDataButton} onPress={onClearAllData}>
          <AppIcon
            name="trash-outline"
            size={20}
            color={SkeuoTheme.colors.danger}
          />
          <Text style={styles.clearDataText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: SkeuoTheme.colors.pageBackground,
  },
  emptyState: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 24,
    alignItems: "center",
    marginBottom: 18,
  },
  emptyStateTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
  },
  emptyStateMessage: {
    marginTop: 8,
    fontSize: 14,
    color: SkeuoTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyStatePrimaryButton: {
    backgroundColor: SkeuoTheme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  emptyStatePrimaryButtonText: {
    color: SkeuoTheme.colors.white,
    fontWeight: "700",
  },
  emptyStateSecondaryButton: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  emptyStateSecondaryButtonText: {
    color: SkeuoTheme.colors.textPrimary,
    fontWeight: "700",
  },
  dateGroup: {
    marginBottom: 25,
  },
  dateHeader: {
    fontSize: 17,
    fontWeight: "800",
    color: SkeuoTheme.colors.textSecondary,
    marginBottom: 12,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    ...SkeuoTheme.shadow.outerSoft,
  },
  medicationColor: {
    width: 14,
    height: 40,
    borderRadius: 7,
    marginRight: 16,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "700",
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.dangerBorder,
    ...SkeuoTheme.shadow.outerSoft,
  },
  clearDataText: {
    color: SkeuoTheme.colors.danger,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
