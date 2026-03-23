/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#1b9f88";
const tintColorDark = "#d8f2ec";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const SkeuoTheme = {
  colors: {
    appBackground: "#d9eeea",
    pageBackground: "#e9f6f2",
    cardBackground: "#f3fbf8",
    cardInset: "#d8ebe5",
    textPrimary: "#173336",
    textSecondary: "#45666a",
    textTertiary: "#76979a",
    accent: "#1b9f88",
    accentDark: "#0e6b63",
    accentSoft: "#d8f2ec",
    success: "#2f9a62",
    successSurface: "#e7f7f2",
    warning: "#d9822b",
    warningSurface: "#fff3e6",
    danger: "#cc4f4f",
    dangerSurface: "#fdeeee",
    dangerBorder: "#f7c9c9",
    neutralSurface: "#edf5f3",
    border: "#bfdad3",
    headerGradientStart: "#2db19a",
    headerGradientEnd: "#0f7267",
    overlayDark: "rgba(0, 0, 0, 0.45)",
    white: "#ffffff",
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 22,
    xl: 28,
  },
  shadow: {
    outer: {
      shadowColor: "#8e9ab0",
      shadowOffset: { width: 6, height: 6 },
      shadowOpacity: 0.32,
      shadowRadius: 10,
      elevation: 8,
    },
    outerSoft: {
      shadowColor: "#95a1b6",
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
      elevation: 5,
    },
    innerGlow: {
      shadowColor: "#ffffff",
      shadowOffset: { width: -4, height: -4 },
      shadowOpacity: 0.95,
      shadowRadius: 8,
      elevation: 0,
    },
  },
};
