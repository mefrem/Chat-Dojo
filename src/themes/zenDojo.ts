// Zen/Spiritual Dojo Theme
// Inspired by: Mindfulness practice, natural materials, calm and centered

export const zenDojoTheme = {
  name: "Zen Garden",
  description: "Calm, centered, mindful practice",

  colors: {
    // Primary colors
    primary: "#a8b5a0", // Sage green - calming accent
    primaryDark: "#8a9682",
    primaryLight: "#bcc9b4",

    // Background colors
    background: "#faf9f7", // Warm off-white
    surface: "#ffffff", // Pure white
    surfaceLight: "#f0eeeb",

    // Text colors
    textPrimary: "#3a3835", // Warm dark gray
    textSecondary: "#75726d",
    textDisabled: "#b5b2ad",

    // Accent colors
    accent: "#e8e5df", // Soft beige
    accentLight: "#f0eeeb",

    // Status colors
    success: "#a8b5a0",
    error: "#c4a69d",
    warning: "#d4c5a9",
    info: "#9badb7",

    // Borders and dividers
    border: "#e0ddd7",
    divider: "#ebe8e3",

    // Message bubbles
    messageSent: "#a8b5a0",
    messageReceived: "#f0eeeb",

    // Special elements
    voiceWaveform: "#a8b5a0",
    onlineIndicator: "#a8b5a0",
  },

  spacing: {
    xs: 6,
    sm: 12,
    md: 20,
    lg: 28,
    xl: 40,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },

  elevation: {
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
  },

  typography: {
    headerWeight: "600" as const,
    bodyWeight: "400" as const,
    buttonWeight: "500" as const,
  },
};

export type ThemeType = typeof zenDojoTheme;
