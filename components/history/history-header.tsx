import { AppIcon } from "@/components/ui/app-icon";
import { SkeuoTheme } from "@/constants/theme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HistoryHeaderProps {
  onBack: () => void;
}

export function HistoryHeader({ onBack }: HistoryHeaderProps) {
  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon
            name="chevron-back"
            size={28}
            color={SkeuoTheme.colors.accentDark}
          />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerKicker}>Adherence</Text>
          <Text style={styles.headerTitle}>History Log</Text>
        </View>
      </View>

      <View style={styles.analyticsBanner}>
        <Text style={styles.analyticsTitle}>Adherence Insights</Text>
        <Text style={styles.analyticsSubtitle}>
          Filter by date, status, and medication to review trends
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    minHeight: 64,
    paddingBottom: 14,
    zIndex: 1,
  },
  headerTextWrap: {
    marginLeft: 14,
  },
  headerKicker: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    fontSize: 32,
    fontWeight: "800",
    color: "white",
  },
  analyticsBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...SkeuoTheme.shadow.outerSoft,
  },
  analyticsTitle: {
    color: SkeuoTheme.colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  analyticsSubtitle: {
    marginTop: 4,
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
