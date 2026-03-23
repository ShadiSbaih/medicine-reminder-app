import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
import { cancelMedicationReminders } from "../../utils/notifications";
import {
    deleteMedication,
    getMedications,
    Medication,
} from "../../utils/storage";

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);

  const loadMedications = useCallback(async () => {
    const data = await getMedications();
    setMedications(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [loadMedications]),
  );

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
              await cancelMedicationReminders(medication.id);
              await deleteMedication(medication.id);
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
          ) : (
            medications.map((medication) => {
              const totalSupply = Math.max(1, medication.totalSupply || 0);
              const supplyPercent = Math.min(
                100,
                Math.max(0, (medication.currentSupply / totalSupply) * 100),
              );
              const lowStock =
                medication.refillReminder &&
                medication.currentSupply <= medication.refillAt;

              return (
                <View key={medication.id} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.titleRow}>
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
                    </View>

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
