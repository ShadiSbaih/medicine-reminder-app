/**
 * Theme Configuration - Pillora Medicine Reminder App
 * 
 * Provides theming context with dark mode support
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import {
  colors,
  lightColors,
  darkColors,
  typography,
  spacing,
  radius,
  shadows,
  touchTargets,
  animation,
  zIndex,
  opacity,
} from './tokens';

export type ColorScheme = 'light' | 'dark' | 'system';
export type ResolvedColorScheme = 'light' | 'dark';

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

export function ThemeProvider({ children, forcedColorScheme }: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const [userPreference, setUserPreference] = React.useState<ColorScheme>('system');
  
  const resolvedColorScheme: ResolvedColorScheme = React.useMemo(() => {
    if (forcedColorScheme) return forcedColorScheme;
    if (userPreference === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return userPreference;
  }, [forcedColorScheme, userPreference, systemColorScheme]);
  
  const theme = resolvedColorScheme === 'dark' ? darkTheme : lightTheme;
  
  const setColorScheme = React.useCallback((scheme: ColorScheme) => {
    setUserPreference(scheme);
  }, []);
  
  const value: ThemeContextValue = {
    theme,
    colorScheme: resolvedColorScheme,
    setColorScheme,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
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

export function useColorScheme(): [ResolvedColorScheme, (scheme: ColorScheme) => void] {
  const context = useContext(ThemeContext);
  if (!context) {
    return ['light', () => {}];
  }
  return [context.colorScheme, context.setColorScheme];
}

// Convenience hook for getting themed styles
export function useThemedStyles<T>(
  createStyles: (theme: Theme) => T
): T {
  const theme = useTheme();
  return React.useMemo(() => createStyles(theme), [theme, createStyles]);
}

// Export for backward compatibility and direct imports
export { colors, lightColors, darkColors };

