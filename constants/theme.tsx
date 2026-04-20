/**
 * Theme Configuration - Pillora Medicine Reminder App
 *
 * Provides theming context with dark mode support
 */

import React, { createContext, ReactNode, useContext } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import {
    animation,
    colors,
    darkColors,
    lightColors,
    opacity,
    radius,
    shadows,
    spacing,
    touchTargets,
    typography,
    zIndex,
} from "./tokens";

export type ColorScheme = "light" | "dark" | "system";
export type ResolvedColorScheme = "light" | "dark";

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundElevated: string;
  backgroundCard: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Borders
  border: string;
  borderSubtle: string;

  // Semantic
  sage: string;
  sageLight: string;
  amber: string;
  amberLight: string;
  coral: string;
  coralLight: string;

  // Accent
  indigo: string;
  indigoLight: string;

  // Static colors (don't change with theme)
  white: string;
  black: string;

  // Original palette (for direct access)
  palette: typeof colors;
}

export interface Theme {
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  touchTargets: typeof touchTargets;
  animation: typeof animation;
  zIndex: typeof zIndex;
  opacity: typeof opacity;
  isDark: boolean;
}

function createTheme(isDark: boolean): Theme {
  const themeColors = isDark ? darkColors : lightColors;

  return {
    colors: {
      ...themeColors,
      white: colors.white,
      black: colors.black,
      palette: colors,
    },
    typography,
    spacing,
    radius,
    shadows,
    touchTargets,
    animation,
    zIndex,
    opacity,
    isDark,
  };
}

export const lightTheme = createTheme(false);
export const darkTheme = createTheme(true);

interface ThemeContextValue {
  theme: Theme;
  colorScheme: ResolvedColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  forcedColorScheme?: ResolvedColorScheme;
}

export function ThemeProvider({
  children,
  forcedColorScheme,
}: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const [userPreference, setUserPreference] =
    React.useState<ColorScheme>("system");

  const resolvedColorScheme: ResolvedColorScheme = React.useMemo(() => {
    if (forcedColorScheme) return forcedColorScheme;
    if (userPreference === "system") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return userPreference;
  }, [forcedColorScheme, userPreference, systemColorScheme]);

  const theme = resolvedColorScheme === "dark" ? darkTheme : lightTheme;

  const setColorScheme = React.useCallback((scheme: ColorScheme) => {
    setUserPreference(scheme);
  }, []);

  const value: ThemeContextValue = {
    theme,
    colorScheme: resolvedColorScheme,
    setColorScheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return light theme as default if used outside provider
    return lightTheme;
  }
  return context.theme;
}

export function useColorScheme(): [
  ResolvedColorScheme,
  (scheme: ColorScheme) => void,
] {
  const context = useContext(ThemeContext);
  if (!context) {
    return ["light", () => {}];
  }
  return [context.colorScheme, context.setColorScheme];
}

// Convenience hook for getting themed styles
export function useThemedStyles<T>(createStyles: (theme: Theme) => T): T {
  const theme = useTheme();
  return React.useMemo(() => createStyles(theme), [theme, createStyles]);
}

// Export for backward compatibility and direct imports
export { colors, darkColors, lightColors };

// Legacy Expo-style Colors map used by existing themed helpers/components.
export const Colors = {
  light: {
    text: lightColors.textPrimary,
    background: lightColors.background,
    tint: colors.indigo,
    icon: lightColors.textSecondary,
    tabIconDefault: lightColors.textMuted,
    tabIconSelected: colors.indigo,
  },
  dark: {
    text: darkColors.textPrimary,
    background: darkColors.background,
    tint: darkColors.indigo,
    icon: darkColors.textSecondary,
    tabIconDefault: darkColors.textMuted,
    tabIconSelected: darkColors.indigo,
  },
} as const;

// Legacy font map expected by older text components.
export const Fonts = {
  sans: typography.fonts.sans,
  rounded: typography.fonts.sans,
  mono: typography.fonts.mono,
} as const;

// Legacy SkeuoTheme export for backward compatibility
// This allows components to use SkeuoTheme.colors.x and SkeuoTheme.shadow.x
export const SkeuoTheme = {
  colors: {
    // Primary
    primary: colors.indigo,
    primaryLight: colors.indigoLight,
    primaryDark: colors.indigoDark,

    // Text
    textPrimary: lightColors.textPrimary,
    textSecondary: lightColors.textSecondary,
    textMuted: lightColors.textMuted,
    textTertiary: lightColors.textMuted,

    // Background
    background: lightColors.background,
    backgroundElevated: lightColors.backgroundElevated,
    surface: lightColors.backgroundCard,
    pageBackground: lightColors.background,
    cardBackground: lightColors.backgroundCard,
    cardInset: "#F5F5F5",

    // Semantic colors
    success: colors.sage,
    successSurface: colors.sageLight,
    successBorder: colors.sageDark,

    warning: colors.amber,
    warningSurface: colors.amberLight,
    warningBorder: colors.amberDark,

    danger: colors.coral,
    dangerSurface: colors.coralLight,
    dangerBorder: colors.coralDark,

    // Accent
    accent: colors.indigo,
    accentLight: colors.indigoLight,
    accentDark: colors.indigoDark,
    accentSoft: colors.indigoLight,

    // Neutrals
    neutralSurface: "#F5F5F5",

    // Border
    border: lightColors.border,
    borderSubtle: lightColors.borderSubtle,

    // Gradients
    headerGradientStart: "#2c7da0",
    headerGradientEnd: "#1e5f7a",

    // Static
    white: colors.white,
    black: colors.black,
  },
  shadow: {
    outer: shadows.md,
    outerSoft: shadows.sm,
    inner: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 0,
    },
  },
  spacing,
  radius,
  typography,
} as const;
