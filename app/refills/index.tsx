import {
    type MedicationEntity,
    useMedicationStore,
} from "@/stores/medication-store";
import { AppIcon } from "@/components/ui/app-icon";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SkeuoTheme } from "../../constants/theme";

type RefillInsight = MedicationEntity & {
  dosesPerDay: number;
  daysLeft: number;
  refillUrgency: "critical" | "soon" | "healthy";
};

const urgencyMeta = {
  critical: { color: SkeuoTheme.colors.danger, label: "Critical" },
  soon: { color: SkeuoTheme.colors.warning, label: "Soon" },
  healthy: { color: SkeuoTheme.colors.success, label: "Healthy" },
} as const;

function RefillCard({ item }: { item: RefillInsight }) {
  const progress =
    item.totalSupply > 0
      ? Math.max(0, Math.min(1, item.currentSupply / item.totalSupply))
      : 0;

  return (
    <View style={styles.medicationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.medTitleContainer}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <Text style={styles.medName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View
          style={[
            styles.urgencyBadge,
            {
              backgroundColor: `${urgencyMeta[item.refillUrgency].color}1A`,
              borderColor: `${urgencyMeta[item.refillUrgency].color}33`,
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

      <View style={styles.cardBody}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.daysLeft}</Text>
            <Text style={styles.statLabel}>Days Left</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statSubValue}>{item.currentSupply}</Text>
            <Text style={styles.statLabel}>Pills Left</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statSubValue}>{item.dosesPerDay}</Text>
            <Text style={styles.statLabel}>Per Day</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Supply Status</Text>
          <Text style={styles.refillAtText}>Refill at {item.refillAt}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>
    </View>
  );
}

export default function RefillsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const medications = useMedicationStore((state) => state.medications);
  const loadMedications = useMedicationStore((state) => state.loadMedications);

  const insights = useMemo<RefillInsight[]>(() => {
    return medications
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
  }, [medications]);

  useFocusEffect(
    useCallback(() => {
      loadMedications().catch((error) => {
        console.error("Error loading refill insights:", error);
      });
    }, [loadMedications]),
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
        style={[styles.headerGradient, { height: insets.top + 210 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppIcon
              name="chevron-back"
              size={24}
              color={SkeuoTheme.colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.titleKicker}>Inventory Management</Text>
          <Text style={styles.headerTitle}>Refill Tracker</Text>
        </View>

        <View style={styles.dashboardWidget}>
          <View style={styles.widgetHeader}>
            <View style={styles.widgetIconContainer}>
              <AppIcon
                name="medical-outline"
                size={20}
                color={SkeuoTheme.colors.accent}
              />
            </View>
            <View>
              <Text style={styles.widgetTitle}>Inventory Status</Text>
              <Text style={styles.widgetSubtitle}>Watch your thresholds</Text>
            </View>
          </View>

          <View style={styles.widgetStats}>
            <View style={styles.widgetStatBox}>
              <Text
                style={[
                  styles.widgetStatValue,
                  criticalCount > 0 && { color: SkeuoTheme.colors.danger },
                ]}
              >
                {criticalCount}
              </Text>
              <Text style={styles.widgetStatLabel}>Critical</Text>
            </View>
            <View style={styles.widgetDivider} />
            <View style={styles.widgetStatBox}>
              <Text
                style={[
                  styles.widgetStatValue,
                  soonCount > 0 && { color: SkeuoTheme.colors.warning },
                ]}
              >
                {soonCount}
              </Text>
              <Text style={styles.widgetStatLabel}>Due Soon</Text>
            </View>
            <View style={styles.widgetDivider} />
            <View style={styles.widgetStatBox}>
              <Text style={styles.widgetStatValue}>{insights.length}</Text>
              <Text style={styles.widgetStatLabel}>Tracking</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {insights.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBackground}>
                <AppIcon
                  name="cube-outline"
                  size={40}
                  color={SkeuoTheme.colors.accent}
                />
              </View>
              <Text style={styles.emptyTitle}>No inventory tracked</Text>
              <Text style={styles.emptyText}>
                Enable refill tracking when adding a medication to see your
                insights here.
              </Text>
            </View>
          ) : (
            insights.map((item) => <RefillCard key={item.id} item={item} />)
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
    height: 180,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: SkeuoTheme.radius.full,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    ...SkeuoTheme.shadow.outerSoft,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 4,
  },
  titleKicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.88)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: SkeuoTheme.colors.white,
    letterSpacing: -0.7,
  },

  // Dashboard Widget Styles
  dashboardWidget: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 24,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 16,
    ...SkeuoTheme.shadow.outerSoft,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  widgetIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${SkeuoTheme.colors.accent}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  widgetTitle: {
    color: SkeuoTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  widgetSubtitle: {
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  widgetStats: {
    flexDirection: "row",
    backgroundColor: SkeuoTheme.colors.cardInset,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
  },
  widgetStatBox: {
    flex: 1,
    alignItems: "center",
  },
  widgetDivider: {
    width: 1,
    height: 30,
    backgroundColor: SkeuoTheme.colors.border,
  },
  widgetStatValue: {
    fontSize: 24,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
  },
  widgetStatLabel: {
    fontSize: 12,
    color: SkeuoTheme.colors.textSecondary,
    marginTop: 4,
    fontWeight: "600",
  },

  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },

  // Refill Card Styles
  medicationCard: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    ...SkeuoTheme.shadow.outerSoft,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  medTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
    borderWidth: 2,
    borderColor: SkeuoTheme.colors.cardBackground,
    ...SkeuoTheme.shadow.outerSoft,
  },
  medName: {
    fontSize: 19,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SkeuoTheme.radius.full,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  cardBody: {
    backgroundColor: SkeuoTheme.colors.cardInset,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: SkeuoTheme.colors.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
  },
  statSubValue: {
    fontSize: 17,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: SkeuoTheme.colors.textSecondary,
    fontWeight: "600",
    marginTop: 4,
  },

  progressContainer: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: SkeuoTheme.colors.textSecondary,
  },
  refillAtText: {
    fontSize: 13,
    fontWeight: "700",
    color: SkeuoTheme.colors.accent,
  },
  progressTrack: {
    height: 10,
    backgroundColor: SkeuoTheme.colors.cardInset,
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: SkeuoTheme.colors.accent,
    borderRadius: 5,
  },

  // Empty State Styles
  emptyCard: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    minHeight: 240,
    marginTop: 8,
    ...SkeuoTheme.shadow.outerSoft,
  },
  emptyIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${SkeuoTheme.colors.accent}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: SkeuoTheme.colors.textPrimary,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: SkeuoTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
