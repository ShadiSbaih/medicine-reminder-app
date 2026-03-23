/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const SkeuoTheme = {
  colors: {
    appBackground: "#d7dfeb",
    pageBackground: "#e6ecf5",
    cardBackground: "#eef3fb",
    cardInset: "#d5ddea",
    textPrimary: "#1f2a3a",
    textSecondary: "#4f5f77",
    accent: "#2f6fd6",
    success: "#2f9a62",
    warning: "#d9822b",
    danger: "#c44747",
    border: "#c3ccda",
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
