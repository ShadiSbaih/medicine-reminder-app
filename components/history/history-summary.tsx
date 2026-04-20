import { SkeuoTheme } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";

interface HistorySummaryProps {
  totalCount: number;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
}

export function HistorySummary({
  totalCount,
  takenCount,
  missedCount,
  skippedCount,
}: HistorySummaryProps) {
  return (
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
  );
}

const styles = StyleSheet.create({
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    paddingVertical: 12,
    alignItems: "center",
    ...SkeuoTheme.shadow.outerSoft,
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
    fontSize: 19,
    fontWeight: "800",
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
    fontSize: 11,
    fontWeight: "700",
    color: SkeuoTheme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.25,
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
});
