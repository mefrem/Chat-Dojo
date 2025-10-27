import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";
import {
  isValidEmail,
  isValidPassword,
  isValidDisplayName,
} from "@/utils/validation";
import { zenDojoTheme } from "@/themes/zenDojo";

interface SignupScreenProps {
  navigation: any;
}

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { signUp } = useAuth();

  const handleSignup = async () => {
    // Validation
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (!isValidPassword(password)) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (!isValidDisplayName(displayName)) {
      Alert.alert("Error", "Display name must be at least 2 characters");
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message || "An error occurred");
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
          <Text variant="displayLarge" style={styles.icon}>
            ⚡
          </Text>
          <Text variant="displayMedium" style={styles.title}>
            TALK DOJO
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Speak truth. Come alive.
          </Text>

          <TextInput
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            autoComplete="name"
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />

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
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Create Account
          </Button>

          <View style={styles.loginContainer}>
            <Text variant="bodyMedium">Already have an account? </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate("Login")}
              disabled={loading}
              compact
            >
              Sign In
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
  icon: {
    textAlign: "center",
    marginBottom: zenDojoTheme.spacing.md,
  },
  title: {
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: zenDojoTheme.spacing.lg,
  },
});
