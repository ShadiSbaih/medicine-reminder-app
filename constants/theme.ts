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
    sans: "Avenir Next",
    serif: "Times New Roman",
    rounded: "Avenir Next",
    mono: "Courier",
  },
  default: {
    sans: "sans-serif",
    serif: "serif",
    rounded: "sans-serif-medium",
    mono: "monospace",
  },
  web: {
    sans: "'Trebuchet MS', 'Gill Sans', 'Segoe UI', sans-serif",
    serif: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    rounded: "'Trebuchet MS', 'Avenir Next', sans-serif",
    mono: "Consolas, Monaco, 'Liberation Mono', monospace",
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
    sm: 12,
    md: 18,
    lg: 28,
    pill: 999,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
  },
  shadow: {
    outer: {
      shadowColor: "#0e3b5a",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 10,
    },
    outerSoft: {
      shadowColor: "#1d5478",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    innerGlow: {
      shadowColor: "#ffffff",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 6,
      elevation: 0,
    },
  },
};
