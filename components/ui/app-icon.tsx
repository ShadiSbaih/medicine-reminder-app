import { IconSymbol } from "@/components/ui/icon-symbol";
import type { ComponentProps } from "react";
import type { StyleProp, ViewStyle } from "react-native";

type IconSymbolName = ComponentProps<typeof IconSymbol>["name"];

type AppIconProps = {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
};

const ICON_NAME_MAP: Record<string, IconSymbolName> = {
  add: "plus",
  "add-circle-outline": "plus.circle",
  "alert-circle": "exclamationmark.circle.fill",
  calendar: "calendar",
  "calendar-clear-outline": "calendar",
  "calendar-outline": "calendar",
  "checkmark-circle": "checkmark.circle.fill",
  "checkmark-done": "checkmark.circle",
  "chevron-back": "chevron.left",
  "chevron-forward": "chevron.right",
  close: "xmark",
  "close-circle": "xmark.circle.fill",
  "code-working-outline": "chevron.left.forwardslash.chevron.right",
  "create-outline": "square.and.pencil",
  "cube-outline": "cube",
  "document-text-outline": "doc.text",
  ellipse: "circle.fill",
  "ellipse-outline": "circle",
  "finger-print-outline": "touchid",
  "information-circle": "info.circle",
  "keypad-outline": "rectangle.grid.3x2",
  "lock-closed": "lock.fill",
  medical: "cross.case.fill",
  "medical-outline": "cross.case",
  notifications: "bell.fill",
  "notifications-off-outline": "bell.slash",
  "notifications-outline": "bell",
  "pause-outline": "pause.circle",
  "play-skip-forward-circle": "forward.end.circle",
  "pulse-outline": "waveform.path.ecg",
  reload: "arrow.clockwise",
  "repeat-outline": "repeat",
  "search-outline": "magnifyingglass",
  "shield-checkmark": "checkmark.shield",
  "sparkles-outline": "sparkles",
  "sunny-outline": "sun.max",
  "sync-outline": "arrow.triangle.2.circlepath",
  time: "clock.fill",
  "time-outline": "clock",
  "trash-outline": "trash",
  "warning-outline": "exclamationmark.triangle",
};

const FALLBACK_ICON: IconSymbolName = "questionmark.circle";

export function AppIcon({ name, size = 24, color, style }: AppIconProps) {
  return (
    <IconSymbol
      name={ICON_NAME_MAP[name] ?? FALLBACK_ICON}
      size={size}
      color={color}
      style={style}
    />
  );
}
