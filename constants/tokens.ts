/**
 * Design Tokens - Pillora Medicine Reminder App
 *
 * A calm, trustworthy design system inspired by editorial design
 * meets medical reliability. Designed for accessibility and ease of use.
 */

// Color Palette
export const colors = {
  // Primary Colors - Warm and calming
  warmStone: "#2D2A26",
  warmStoneMuted: "#4A4640",
  cream: "#F8F6F3",
  creamDark: "#EDE9E3",

  // Semantic Colors
  sage: "#7CAB8A", // Success/taken
  sageLight: "#E8F2EB",
  sageDark: "#5E8A6B",

  amber: "#D4A853", // Warning/soon
  amberLight: "#FDF5E6",
  amberDark: "#B8923F",

  coral: "#D97B6C", // Alert/missed
  coralLight: "#FDF0EE",
  coralDark: "#C45A4A",

  // Accent Colors
  indigo: "#4338CA", // Primary actions
  indigoLight: "#EEF2FF",
  indigoDark: "#3730A3",

  purple: "#8B7EC8", // Secondary accents
  purpleLight: "#F5F3FF",

  // Neutrals
  steel: "#6B7280",
  steelLight: "#9CA3AF",
  steelLighter: "#D1D5DB",

  // Base
  white: "#FFFFFF",
  black: "#000000",

  // Overlays
  overlayLight: "rgba(0, 0, 0, 0.05)",
  overlayMedium: "rgba(0, 0, 0, 0.3)",
  overlayDark: "rgba(0, 0, 0, 0.6)",
} as const;

// Dark mode colors
export const darkColors = {
  // Backgrounds
  background: "#1A1917",
  backgroundElevated: "#252320",
  backgroundCard: "#2D2A26",

  // Text
  textPrimary: "#F8F6F3",
  textSecondary: "#A8A29E",
  textMuted: "#78716C",

  // Borders
  border: "#3D3935",
  borderSubtle: "#2D2A26",

  // Semantic - slightly adjusted for dark mode
  sage: "#8FBE9C",
  sageLight: "#1F2D23",

  amber: "#E5BA64",
  amberLight: "#2D2718",

  coral: "#E8897A",
  coralLight: "#2D1F1D",

  // Accent
  indigo: "#6366F1",
  indigoLight: "#1E1B4B",
} as const;

// Light mode colors
export const lightColors = {
  // Backgrounds
  background: "#F8F6F3",
  backgroundElevated: "#FFFFFF",
  backgroundCard: "#FFFFFF",

  // Text
  textPrimary: "#2D2A26",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",

  // Borders
  border: "#E5E1DB",
  borderSubtle: "#F0EDE8",

  // Semantic
  sage: colors.sage,
  sageLight: colors.sageLight,

  amber: colors.amber,
  amberLight: colors.amberLight,

  coral: colors.coral,
  coralLight: colors.coralLight,

  // Accent
  indigo: colors.indigo,
  indigoLight: colors.indigoLight,
} as const;

// Typography Scale
export const typography = {
  // Font families
  fonts: {
    sans: "System",
    mono: "monospace",
  },

  // Font sizes with line heights
  sizes: {
    display: {
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: -0.5,
    },
    headline: {
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: -0.25,
    },
    title: {
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: 0,
    },
    titleSmall: {
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodyLarge: {
      fontSize: 18,
      lineHeight: 26,
      letterSpacing: 0.15,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    label: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
    },
  },

  // Font weights
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
} as const;

// Spacing Scale (8px base)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
  "5xl": 80,
} as const;

// Border Radius
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  full: 9999,
} as const;

// Shadows
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Touch targets (minimum 48x48 for accessibility)
export const touchTargets = {
  min: 48,
  comfortable: 56,
  large: 64,
} as const;

// Animation timings
export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  elevated: 1,
  sticky: 10,
  overlay: 50,
  modal: 100,
  toast: 200,
} as const;

// Opacity scale
export const opacity = {
  disabled: 0.4,
  muted: 0.6,
  subtle: 0.8,
  full: 1,
} as const;
