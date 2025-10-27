import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Button } from "react-native-paper";
import { zenDojoTheme } from "@/themes/zenDojo";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserDoc } from "@/services/user";

interface OnboardingScreenProps {
  navigation: any;
  route: {
    params: {
      isNewUser?: boolean;
    };
  };
}

export default function OnboardingScreen({
  navigation,
  route,
}: OnboardingScreenProps) {
  const { user } = useAuth();

  const handleContinue = async () => {
    if (user) {
      try {
        // Mark user as having seen onboarding
        await updateUserDoc(user.uid, { hasSeenOnboarding: true });
      } catch (error) {
        console.error("Error updating onboarding status:", error);
      }
    }
    navigation.replace("Home");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚡</Text>
        </View>

        <Text style={styles.title}>TALK DOJO</Text>

        <View style={styles.messageContainer}>
          <Text style={styles.messageLine}>
            Train awareness of body, heart, and mind.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.messageLine}>Speak from their energy.</Text>
          <View style={styles.divider} />
          <Text style={styles.messageHighlight}>
            When you speak what you're afraid to say,
          </Text>
          <Text style={styles.messageHighlightBold}>you come alive.</Text>
        </View>

        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          ENTER THE DOJO
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: zenDojoTheme.colors.background,
    justifyContent: "center",
    paddingVertical: zenDojoTheme.spacing.xl,
  },
  content: {
    paddingHorizontal: zenDojoTheme.spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: zenDojoTheme.spacing.md,
  },
  icon: {
    fontSize: 56,
    textAlign: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: zenDojoTheme.spacing.xl,
    color: zenDojoTheme.colors.textPrimary,
  },
  messageContainer: {
    backgroundColor: zenDojoTheme.colors.surface,
    padding: zenDojoTheme.spacing.lg,
    borderRadius: zenDojoTheme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: zenDojoTheme.colors.primary,
    marginBottom: zenDojoTheme.spacing.xl,
    width: "100%",
  },
  messageLine: {
    fontSize: 16,
    lineHeight: 24,
    color: zenDojoTheme.colors.textPrimary,
    textAlign: "center",
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: zenDojoTheme.colors.primary,
    alignSelf: "center",
    marginVertical: zenDojoTheme.spacing.md,
  },
  messageHighlight: {
    fontSize: 17,
    lineHeight: 26,
    color: zenDojoTheme.colors.textPrimary,
    textAlign: "center",
    marginBottom: zenDojoTheme.spacing.sm,
  },
  messageHighlightBold: {
    fontSize: 18,
    fontWeight: "700",
    color: zenDojoTheme.colors.primary,
    textAlign: "center",
    display: "flex",
  },
  button: {
    minWidth: 240,
    borderRadius: zenDojoTheme.borderRadius.md,
    elevation: 4,
    shadowColor: zenDojoTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonContent: {
    paddingVertical: zenDojoTheme.spacing.sm,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
