import { SkeuoTheme } from "@/constants/theme";
import { isMedicationActiveOnDate } from "@/shared/utils/medication-schedule";
import {
  type MedicationEntity,
  useMedicationStore,
} from "@/stores/medication-store";
import { AppIcon } from "@/components/ui/app-icon";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MedicationFilter = "all" | "active" | "low-stock" | "reminders-off";

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const medications = useMedicationStore((state) => state.medications);
  const loadMedications = useMedicationStore((state) => state.loadMedications);
  const removeMedication = useMedicationStore((state) => state.removeMedication);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<MedicationFilter>("all");

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [loadMedications]),
  );

  const filteredMedications = useMemo<MedicationEntity[]>(() => {
    const query = searchQuery.trim().toLowerCase();

    return medications.filter((medication) => {
      const activeToday = isMedicationActiveOnDate(medication, new Date());
      const lowStock =
        medication.refillReminder &&
        medication.currentSupply <= medication.refillAt;

      const filterMatch =
        selectedFilter === "all"
          ? true
          : selectedFilter === "active"
            ? activeToday
            : selectedFilter === "low-stock"
              ? lowStock
              : !medication.reminderEnabled;

      if (!filterMatch) return false;

      if (!query) return true;

      return (
        medication.name.toLowerCase().includes(query) ||
        medication.dosage.toLowerCase().includes(query) ||
        medication.frequency.toLowerCase().includes(query)
      );
    });
  }, [medications, searchQuery, selectedFilter]);

  const summary = useMemo(() => {
    const active = medications.filter((medication) =>
      isMedicationActiveOnDate(medication, new Date()),
    ).length;
    const lowStock = medications.filter(
      (medication) =>
        medication.refillReminder &&
        medication.currentSupply <= medication.refillAt,
    ).length;
    return {
      total: medications.length,
      active,
      lowStock,
      visible: filteredMedications.length,
    };
  }, [filteredMedications.length, medications]);

  const handleDelete = (medication: MedicationEntity) => {
    Alert.alert(
      "Delete Medication",
      `Delete ${medication.name}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMedication(medication.id);
            } catch (error) {
              console.error("Error deleting medication:", error);
              Alert.alert("Error", "Failed to delete medication.");
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
        style={[styles.headerGradient, { height: insets.top + 220 }]}
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
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerKicker}>Medication Workspace</Text>
            <Text style={styles.headerTitle}>Medications</Text>
          </View>
        </View>

        <View style={styles.summaryPanel}>
          <View style={styles.summaryPanelTop}>
            <Text style={styles.summaryKicker}>Medication Center</Text>
            <Text style={styles.summaryVisible}>{summary.visible} visible</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.total}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.active}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.lowStock}</Text>
              <Text style={styles.summaryLabel}>Low Stock</Text>
            </View>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.searchInputWrapper}>
            <AppIcon
              name="search-outline"
              size={18}
              color={SkeuoTheme.colors.textSecondary}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search medication"
              placeholderTextColor={SkeuoTheme.colors.textTertiary}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <AppIcon
                  name="close-circle"
                  size={18}
                  color={SkeuoTheme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterPanel}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "low-stock", label: "Low stock" },
                { key: "reminders-off", label: "Reminders off" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.filterChip,
                    selectedFilter === item.key && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setSelectedFilter(item.key as MedicationFilter)
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === item.key &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {medications.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppIcon
                name="medical-outline"
                size={44}
                color={SkeuoTheme.colors.textTertiary}
              />
              <Text style={styles.emptyTitle}>No medications yet</Text>
              <Text style={styles.emptyText}>
                Add your first medication to start reminders and tracking.
              </Text>
              <TouchableOpacity
                style={styles.addInlineButton}
                onPress={() => router.push("/medications/add")}
              >
                <Text style={styles.addInlineButtonText}>Add Medication</Text>
              </TouchableOpacity>
            </View>
          ) : filteredMedications.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppIcon
                name="search-outline"
                size={40}
                color={SkeuoTheme.colors.textTertiary}
              />
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptyText}>
                Adjust your search or filters to find medications.
              </Text>
            </View>
          ) : (
            filteredMedications.map((medication) => {
              const totalSupply = Math.max(1, medication.totalSupply || 0);
              const supplyPercent = Math.min(
                100,
                Math.max(0, (medication.currentSupply / totalSupply) * 100),
              );
              const lowStock =
                medication.refillReminder &&
                medication.currentSupply <= medication.refillAt;
              const isActive = isMedicationActiveOnDate(medication, new Date());

              return (
                <View key={medication.id} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <TouchableOpacity
                      style={styles.titleRow}
                      onPress={() =>
                        router.push({
                          pathname: "./[id]",
                          params: { id: medication.id },
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.colorPill,
                          {
                            backgroundColor:
                              medication.color || SkeuoTheme.colors.accent,
                          },
                        ]}
                      />
                      <View style={styles.titleTextWrap}>
                        <Text style={styles.name} numberOfLines={1}>
                          {medication.name}
                        </Text>
                        <Text style={styles.dosage}>{medication.dosage}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() =>
                          router.push({
                            pathname: "/medications/add",
                            params: { medicationId: medication.id },
                          })
                        }
                      >
                        <AppIcon
                          name="create-outline"
                          size={18}
                          color={SkeuoTheme.colors.white}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(medication)}
                      >
                        <AppIcon
                          name="trash-outline"
                          size={18}
                          color={SkeuoTheme.colors.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <AppIcon
                        name={isActive ? "pulse-outline" : "pause-outline"}
                        size={14}
                        color={SkeuoTheme.colors.textSecondary}
                      />
                      <Text style={styles.metaChipText}>
                        {isActive ? "Active" : "Completed"}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <AppIcon
                        name="time-outline"
                        size={14}
                        color={SkeuoTheme.colors.textSecondary}
                      />
                      <Text style={styles.metaChipText}>
                        {medication.frequency}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <AppIcon
                        name={
                          medication.reminderEnabled
                            ? "notifications-outline"
                            : "notifications-off-outline"
                        }
                        size={14}
                        color={SkeuoTheme.colors.textSecondary}
                      />
                      <Text style={styles.metaChipText}>
                        {medication.reminderEnabled
                          ? "Reminders On"
                          : "Reminders Off"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.supplyPanel}>
                    <View style={styles.supplyHeaderRow}>
                      <Text style={styles.supplyLabel}>
                        Supply {medication.currentSupply}/
                        {medication.totalSupply}
                      </Text>
                      {lowStock && (
                        <Text style={styles.lowStockText}>Low stock</Text>
                      )}
                    </View>
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
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => router.push("/medications/add")}
          activeOpacity={0.9}
        >
          <AppIcon name="add" size={24} color={SkeuoTheme.colors.white} />
        </TouchableOpacity>
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
  },
  content: {
    flex: 1,
  },
  summaryPanel: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 16,
    ...SkeuoTheme.shadow.outerSoft,
  },
  summaryPanelTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryKicker: {
    color: SkeuoTheme.colors.accentDark,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  summaryVisible: {
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    paddingVertical: 12,
    alignItems: "center",
  },
  summaryValue: {
    color: SkeuoTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  summaryLabel: {
    marginTop: 2,
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
    minHeight: 50,
  },
  filterPanel: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    borderRadius: 16,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 2,
  },
  searchInput: {
    flex: 1,
    color: SkeuoTheme.colors.textPrimary,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  filterChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: SkeuoTheme.colors.accent,
    borderColor: SkeuoTheme.colors.accent,
  },
  filterChipText: {
    color: SkeuoTheme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 12,
  },
  filterChipTextActive: {
    color: SkeuoTheme.colors.white,
  },
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
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyCard: {
    marginTop: 10,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
  },
  emptyText: {
    marginTop: 6,
    textAlign: "center",
    color: SkeuoTheme.colors.textSecondary,
    lineHeight: 20,
  },
  addInlineButton: {
    marginTop: 14,
    backgroundColor: SkeuoTheme.colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  addInlineButtonText: {
    color: SkeuoTheme.colors.white,
    fontWeight: "700",
  },
  card: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 16,
    marginBottom: 12,
    ...SkeuoTheme.shadow.outerSoft,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  colorPill: {
    width: 14,
    height: 52,
    borderRadius: 7,
    marginRight: 12,
  },
  titleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 21,
    fontWeight: "800",
    color: SkeuoTheme.colors.textPrimary,
  },
  dosage: {
    marginTop: 3,
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 15,
  },
  actionsRow: {
    marginLeft: 12,
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: SkeuoTheme.colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: SkeuoTheme.colors.dangerSurface,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.dangerBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
  },
  metaChipText: {
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  supplyPanel: {
    marginTop: 12,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  supplyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  supplyLabel: {
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  lowStockText: {
    color: SkeuoTheme.colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  supplyTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    overflow: "hidden",
  },
  supplyFill: {
    height: "100%",
    borderRadius: 999,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.accent,
    ...SkeuoTheme.shadow.outer,
  },
});
