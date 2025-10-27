import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { TextInput, Button, Text, HelperText } from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";
import { isValidEmail } from "@/utils/validation";
import { zenDojoTheme } from "@/themes/zenDojo";

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error: any) {
      Alert.alert("Sign In Failed", error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text variant="displayLarge" style={styles.title}>
            ⚡
          </Text>
          <Text variant="displayMedium" style={styles.appName}>
            TALK DOJO
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Speak truth. Come alive.
          </Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            mode="outlined"
            style={styles.input}
            disabled={loading}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign In
          </Button>

          <View style={styles.signupContainer}>
            <Text variant="bodyMedium">Don't have an account? </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate("Signup")}
              disabled={loading}
              compact
            >
              Sign Up
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: zenDojoTheme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: zenDojoTheme.spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: zenDojoTheme.spacing.md,
  },
  appName: {
    textAlign: "center",
    marginBottom: zenDojoTheme.spacing.md,
    fontWeight: "700",
    letterSpacing: 3,
    color: zenDojoTheme.colors.textPrimary,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: zenDojoTheme.spacing.xl,
    color: zenDojoTheme.colors.textPrimary,
    fontWeight: "600",
    lineHeight: 28,
  },
  input: {
    marginBottom: zenDojoTheme.spacing.md,
    backgroundColor: zenDojoTheme.colors.surface,
  },
  button: {
    marginTop: zenDojoTheme.spacing.md,
    paddingVertical: zenDojoTheme.spacing.xs,
    borderRadius: zenDojoTheme.borderRadius.md,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: zenDojoTheme.spacing.lg,
  },
});
