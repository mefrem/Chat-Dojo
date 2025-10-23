import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { List, Appbar, Avatar, Text, Button } from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        onPress: async () => {
          setLoading(true);
          try {
            await signOut();
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          } finally {
            setLoading(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <View style={styles.profileSection}>
        <Avatar.Text
          size={80}
          label={user?.displayName.substring(0, 2).toUpperCase() || "U"}
        />
        <Text variant="headlineSmall" style={styles.displayName}>
          {user?.displayName}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email}
        </Text>
      </View>

      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title="Display Name"
          description={user?.displayName}
          left={(props) => <List.Icon {...props} icon="account" />}
        />
        <List.Item
          title="Email"
          description={user?.email}
          left={(props) => <List.Icon {...props} icon="email" />}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Version"
          description="1.0.0 (MVP)"
          left={(props) => <List.Icon {...props} icon="information" />}
        />
      </List.Section>

      <View style={styles.signOutContainer}>
        <Button
          mode="contained"
          onPress={handleSignOut}
          loading={loading}
          disabled={loading}
          buttonColor="#ff6b6b"
        >
          Sign Out
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  profileSection: {
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  displayName: {
    marginTop: 16,
    fontWeight: "bold",
  },
  email: {
    marginTop: 4,
    color: "#666",
  },
  signOutContainer: {
    padding: 24,
    marginTop: "auto",
  },
});
