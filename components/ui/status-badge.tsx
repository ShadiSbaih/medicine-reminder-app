import { AppIcon } from "@/components/ui/app-icon";
import { SkeuoTheme } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";

type StatusType = "taken" | "missed" | "skipped" | "overdue" | "upcoming";

interface StatusBadgeProps {
  status: StatusType;
  compact?: boolean;
}

const STATUS_CONFIG: Record<
  StatusType,
  {
    label: string;
    icon: string;
    bg: string;
    fg: string;
    border?: string;
  }
> = {
  taken: {
    label: "Taken",
    icon: "checkmark-circle",
    bg: SkeuoTheme.colors.successSurface,
    fg: SkeuoTheme.colors.success,
  },
  missed: {
    label: "Missed",
    icon: "close-circle",
    bg: SkeuoTheme.colors.dangerSurface,
    fg: SkeuoTheme.colors.danger,
    border: SkeuoTheme.colors.dangerBorder,
  },
  skipped: {
    label: "Skipped",
    icon: "play-skip-forward-circle",
    bg: SkeuoTheme.colors.neutralSurface,
    fg: SkeuoTheme.colors.textSecondary,
  },
  overdue: {
    label: "Overdue",
    icon: "alert-circle",
    bg: SkeuoTheme.colors.dangerSurface,
    fg: SkeuoTheme.colors.danger,
    border: SkeuoTheme.colors.dangerBorder,
  },
  upcoming: {
    label: "Upcoming",
    icon: "time",
    bg: SkeuoTheme.colors.warningSurface,
    fg: SkeuoTheme.colors.warning,
  },
};

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        {
          backgroundColor: config.bg,
          borderColor: config.border ?? "transparent",
        },
      ]}
    >
      <AppIcon name={config.icon} size={compact ? 14 : 16} color={config.fg} />
      <Text
        style={[
          styles.text,
          compact && styles.textCompact,
          { color: config.fg },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeCompact: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
  },
  text: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  textCompact: {
    fontSize: 11,
  },
});
