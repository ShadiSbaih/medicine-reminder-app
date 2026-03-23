import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SkeuoTheme } from "../../constants/theme";
import { getMedications, Medication } from "../../utils/storage";

type RefillInsight = Medication & {
  dosesPerDay: number;
  daysLeft: number;
  refillUrgency: "critical" | "soon" | "healthy";
};

const urgencyMeta = {
  critical: { color: SkeuoTheme.colors.danger, label: "Critical" },
  soon: { color: SkeuoTheme.colors.warning, label: "Soon" },
  healthy: { color: SkeuoTheme.colors.success, label: "Healthy" },
} as const;

export default function RefillsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [insights, setInsights] = useState<RefillInsight[]>([]);

  const loadRefills = useCallback(async () => {
    const medications = await getMedications();
    const refillItems = medications
      .filter(
        (medication) => medication.refillReminder || medication.totalSupply > 0,
      )
      .map((medication) => {
        const dosesPerDay = Math.max(medication.times.length, 1);
        const daysLeft =
          medication.currentSupply > 0
            ? Math.floor(medication.currentSupply / dosesPerDay)
            : 0;

        const refillUrgency: RefillInsight["refillUrgency"] =
          medication.currentSupply <= medication.refillAt
            ? "critical"
            : daysLeft <= 7
              ? "soon"
              : "healthy";

        return {
          ...medication,
          dosesPerDay,
          daysLeft,
          refillUrgency,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    setInsights(refillItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRefills();
    }, [loadRefills]),
  );

  const criticalCount = insights.filter(
    (item) => item.refillUrgency === "critical",
  ).length;
  const soonCount = insights.filter(
    (item) => item.refillUrgency === "soon",
  ).length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          SkeuoTheme.colors.headerGradientStart,
          SkeuoTheme.colors.headerGradientEnd,
        ]}
        style={[styles.headerGradient, { height: insets.top + 96 }]}
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
            <Ionicons
              name="chevron-back"
              size={28}
              color={SkeuoTheme.colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refill Tracker</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{criticalCount}</Text>
            <Text style={styles.summaryLabel}>Critical</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{soonCount}</Text>
            <Text style={styles.summaryLabel}>Due Soon</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{insights.length}</Text>
            <Text style={styles.summaryLabel}>Tracked</Text>
          </View>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {insights.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="cube-outline"
                size={34}
                color={SkeuoTheme.colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>No inventory tracked yet</Text>
              <Text style={styles.emptyText}>
                Enable refill tracking when adding a medication to see insights.
              </Text>
            </View>
          ) : (
            insights.map((item) => {
              const progress =
                item.totalSupply > 0
                  ? Math.max(
                      0,
                      Math.min(1, item.currentSupply / item.totalSupply),
                    )
                  : 0;

              return (
                <View key={item.id} style={styles.medicationCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.medMain}>
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: item.color },
                        ]}
                      />
                      <View>
                        <Text style={styles.medName}>{item.name}</Text>
                        <Text style={styles.medSub}>
                          {item.currentSupply} left · {item.dosesPerDay}/day
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.urgencyBadge,
                        {
                          backgroundColor: `${urgencyMeta[item.refillUrgency].color}22`,
                          borderColor: `${urgencyMeta[item.refillUrgency].color}66`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          { color: urgencyMeta[item.refillUrgency].color },
                        ]}
                      >
                        {urgencyMeta[item.refillUrgency].label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress * 100}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.bottomRow}>
                    <Text style={styles.daysLeft}>
                      {item.daysLeft} days left
                    </Text>
                    <Text style={styles.refillAt}>
                      Refill at {item.refillAt}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
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
    height: 130,
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
    marginBottom: 18,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: SkeuoTheme.radius.pill,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    shadowColor: "#5f807f",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: SkeuoTheme.colors.white,
    marginLeft: 14,
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: SkeuoTheme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    shadowColor: "#5f807f",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: SkeuoTheme.colors.textSecondary,
    marginTop: 4,
  },
  list: {
    flex: 1,
    marginTop: 14,
    paddingHorizontal: 20,
  },
  emptyCard: {
    marginTop: 30,
    borderRadius: SkeuoTheme.radius.lg,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 24,
    alignItems: "center",
    shadowColor: "#5f807f",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    color: SkeuoTheme.colors.textSecondary,
  },
  medicationCard: {
    borderRadius: SkeuoTheme.radius.lg,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#5f807f",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  medMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  colorDot: {
    width: 12,
    height: 36,
    borderRadius: 10,
  },
  medName: {
    fontSize: 16,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
  },
  medSub: {
    marginTop: 2,
    fontSize: 13,
    color: SkeuoTheme.colors.textSecondary,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SkeuoTheme.radius.pill,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressTrack: {
    marginTop: 14,
    height: 10,
    borderRadius: SkeuoTheme.radius.pill,
    backgroundColor: SkeuoTheme.colors.cardInset,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: SkeuoTheme.radius.pill,
    backgroundColor: SkeuoTheme.colors.accent,
  },
  bottomRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  daysLeft: {
    fontSize: 13,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
  },
  refillAt: {
    fontSize: 13,
    color: SkeuoTheme.colors.textSecondary,
  },
});
