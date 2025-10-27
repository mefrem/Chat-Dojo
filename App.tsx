import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/contexts/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { zenDojoTheme } from "./src/themes/zenDojo";

// Zen Garden Theme - Calm, centered, mindful design
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: zenDojoTheme.colors.primary,
    secondary: zenDojoTheme.colors.accent,
    background: zenDojoTheme.colors.background,
    surface: zenDojoTheme.colors.surface,
    surfaceVariant: zenDojoTheme.colors.surfaceLight,
    onPrimary: zenDojoTheme.colors.background,
    onSecondary: zenDojoTheme.colors.textPrimary,
    onSurface: zenDojoTheme.colors.textPrimary,
    onBackground: zenDojoTheme.colors.textPrimary,
    error: zenDojoTheme.colors.error,
    onError: "#fff",
    outline: zenDojoTheme.colors.border,
  },
  roundness: zenDojoTheme.borderRadius.md,
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
