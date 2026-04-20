import { AppIcon } from "@/components/ui/app-icon";
import { SkeuoTheme } from "@/constants/theme";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export type HistoryStatusFilter = "all" | "taken" | "missed" | "skipped";
export type HistoryTimeFilter = "all" | "today" | "7d" | "30d";

interface HistoryFiltersProps {
  selectedFilter: HistoryStatusFilter;
  onSelectFilter: (filter: HistoryStatusFilter) => void;
  timeFilter: HistoryTimeFilter;
  onSelectTimeFilter: (filter: HistoryTimeFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

const STATUS_FILTERS: { key: HistoryStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "taken", label: "Taken" },
  { key: "missed", label: "Missed" },
  { key: "skipped", label: "Skipped" },
];

const TIME_FILTERS: { key: HistoryTimeFilter; label: string }[] = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
];

export function HistoryFilters({
  selectedFilter,
  onSelectFilter,
  timeFilter,
  onSelectTimeFilter,
  searchQuery,
  onSearchQueryChange,
}: HistoryFiltersProps) {
  return (
    <View style={styles.filtersContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
      >
        {STATUS_FILTERS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.filterButton,
              selectedFilter === item.key && styles.filterButtonActive,
            ]}
            onPress={() => onSelectFilter(item.key)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === item.key && styles.filterTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <AppIcon
            name="search-outline"
            size={18}
            color={SkeuoTheme.colors.textSecondary}
          />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            placeholder="Search by medication or dosage"
            placeholderTextColor={SkeuoTheme.colors.textTertiary}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchQueryChange("")}>
              <AppIcon
                name="close-circle"
                size={18}
                color={SkeuoTheme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {TIME_FILTERS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.timeChip,
              timeFilter === item.key && styles.timeChipActive,
            ]}
            onPress={() => onSelectTimeFilter(item.key)}
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
  );
}

const styles = StyleSheet.create({
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 14,
    backgroundColor: SkeuoTheme.colors.pageBackground,
    paddingTop: 0,
  },
  filtersScroll: {
    paddingRight: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
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
    fontWeight: "700",
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
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 2,
  },
  timeChipActive: {
    backgroundColor: SkeuoTheme.colors.accent,
    borderColor: SkeuoTheme.colors.accent,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: SkeuoTheme.colors.textSecondary,
  },
  timeChipTextActive: {
    color: SkeuoTheme.colors.white,
  },
});
