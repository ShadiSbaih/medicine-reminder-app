import { medicationService } from "@/services/medication-service";
import { isMedicationActiveOnDate } from "@/shared/utils/medication-schedule";
import { Ionicons } from "@expo/vector-icons";
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
import { SkeuoTheme } from "../../constants/theme";
import { Medication } from "../../utils/storage";

type MedicationFilter = "all" | "active" | "low-stock" | "reminders-off";

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<MedicationFilter>("all");

  const loadMedications = useCallback(async () => {
    const data = await medicationService.list();
    setMedications(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [loadMedications]),
  );

  const filteredMedications = useMemo(() => {
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

  const handleDelete = (medication: Medication) => {
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
              await medicationService.remove(medication.id);
              await loadMedications();
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
            <Ionicons
              name="chevron-back"
              size={28}
              color={SkeuoTheme.colors.accentDark}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medications</Text>
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons
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
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={SkeuoTheme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

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
                onPress={() => setSelectedFilter(item.key as MedicationFilter)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === item.key && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {medications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
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
              <Ionicons
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
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={SkeuoTheme.colors.white}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(medication)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={SkeuoTheme.colors.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <Ionicons
                        name={isActive ? "pulse-outline" : "pause-outline"}
                        size={14}
                        color={SkeuoTheme.colors.textSecondary}
                      />
                      <Text style={styles.metaChipText}>
                        {isActive ? "Active" : "Completed"}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={SkeuoTheme.colors.textSecondary}
                      />
                      <Text style={styles.metaChipText}>
                        {medication.frequency}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Ionicons
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

                  <View style={styles.supplyHeaderRow}>
                    <Text style={styles.supplyLabel}>
                      Supply {medication.currentSupply}/{medication.totalSupply}
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
              );
            })
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => router.push("/medications/add")}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={24} color={SkeuoTheme.colors.white} />
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
  controlsContainer: {
    paddingHorizontal: 20,
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
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: SkeuoTheme.colors.textPrimary,
    paddingVertical: 10,
    marginLeft: 8,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    backgroundColor: SkeuoTheme.colors.cardBackground,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: SkeuoTheme.colors.accent,
    borderColor: SkeuoTheme.colors.accent,
  },
  filterChipText: {
    color: SkeuoTheme.colors.textSecondary,
    fontWeight: "600",
    fontSize: 12,
  },
  filterChipTextActive: {
    color: SkeuoTheme.colors.white,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "700",
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
    paddingVertical: 10,
    borderRadius: 12,
  },
  addInlineButtonText: {
    color: SkeuoTheme.colors.white,
    fontWeight: "700",
  },
  card: {
    backgroundColor: SkeuoTheme.colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SkeuoTheme.colors.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#5f807f",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
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
    width: 10,
    height: 46,
    borderRadius: 5,
    marginRight: 12,
  },
  titleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SkeuoTheme.colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  metaChipText: {
    color: SkeuoTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  supplyHeaderRow: {
    marginTop: 12,
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
    marginTop: 7,
    height: 8,
    borderRadius: 999,
    backgroundColor: SkeuoTheme.colors.neutralSurface,
    overflow: "hidden",
  },
  supplyFill: {
    height: "100%",
    borderRadius: 999,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SkeuoTheme.colors.accent,
    shadowColor: "#0e6b63",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
});
