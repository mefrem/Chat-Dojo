import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import {
  List,
  Appbar,
  Avatar,
  Text,
  Button,
  Dialog,
  Portal,
  RadioButton,
  Snackbar,
} from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDoc, updateTimeCommitment } from "@/services/user";
import { User } from "@/types";

// Conditionally import clipboard (only works in dev builds, not Expo Go)
let Clipboard: any = null;
try {
  Clipboard = require("expo-clipboard");
} catch (e) {
  console.log("Clipboard not available in Expo Go");
}

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [userDoc, setUserDoc] = useState<User | null>(null);
  const [timeCommitmentDialogVisible, setTimeCommitmentDialogVisible] =
    useState(false);
  const [selectedTimeCommitment, setSelectedTimeCommitment] = useState<
    "5min" | "15min" | "30min" | undefined
  >(undefined);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    if (user) {
      loadUserDoc();
    }
  }, [user]);

  const loadUserDoc = async () => {
    if (!user) return;
    try {
      const doc = await getUserDoc(user.uid);
      if (doc) {
        setUserDoc(doc);
        setSelectedTimeCommitment(doc.timeCommitment);
      }
    } catch (error) {
      console.error("Error loading user doc:", error);
    }
  };

  const handleCopyPartnerCode = async () => {
    if (userDoc?.partnerCode) {
      if (Clipboard) {
        await Clipboard.setStringAsync(userDoc.partnerCode);
        setSnackbarMessage("Partner code copied!");
      } else {
        // Fallback for Expo Go - just show the code
        Alert.alert("Your Partner Code", userDoc.partnerCode, [{ text: "OK" }]);
        setSnackbarMessage(
          "Partner code shown (copy not available in Expo Go)"
        );
      }
      setSnackbarVisible(true);
    }
  };

  const handleSaveTimeCommitment = async () => {
    if (!user || !selectedTimeCommitment) return;

    try {
      await updateTimeCommitment(user.uid, selectedTimeCommitment);
      setTimeCommitmentDialogVisible(false);
      setSnackbarMessage("Time commitment updated!");
      setSnackbarVisible(true);
      await loadUserDoc();
    } catch (error) {
      console.error("Error updating time commitment:", error);
      Alert.alert("Error", "Failed to update time commitment");
    }
  };

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
        <Appbar.BackAction
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("Home");
            }
          }}
          color="#6200ee"
        />
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
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
          <List.Subheader>Chat Dojo</List.Subheader>
          <List.Item
            title="Partner Code"
            description={userDoc?.partnerCode || "Loading..."}
            left={(props) => <List.Icon {...props} icon="qrcode" />}
            right={(props) => <List.Icon {...props} icon="content-copy" />}
            onPress={handleCopyPartnerCode}
          />
          <List.Item
            title="Time Commitment"
            description={
              userDoc?.timeCommitment
                ? `${userDoc.timeCommitment} per conversation`
                : "Not set - tap to choose"
            }
            left={(props) => <List.Icon {...props} icon="clock-outline" />}
            onPress={() => setTimeCommitmentDialogVisible(true)}
          />
          <List.Item
            title="Current Streak"
            description={`${userDoc?.streakDays || 0} days 🔥`}
            left={(props) => <List.Icon {...props} icon="fire" />}
          />
          <List.Item
            title="My Contacts"
            description="Saved partners"
            left={(props) => <List.Icon {...props} icon="account-group" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate("Contacts")}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Version"
            description="1.0.0 (Phase 3)"
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
      </ScrollView>

      <Portal>
        <Dialog
          visible={timeCommitmentDialogVisible}
          onDismiss={() => setTimeCommitmentDialogVisible(false)}
        >
          <Dialog.Title>Time Commitment</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              How much time can you commit to each conversation?
            </Text>
            <RadioButton.Group
              onValueChange={(value) =>
                setSelectedTimeCommitment(value as "5min" | "15min" | "30min")
              }
              value={selectedTimeCommitment || ""}
            >
              <RadioButton.Item label="5 minutes" value="5min" />
              <RadioButton.Item label="15 minutes" value="15min" />
              <RadioButton.Item label="30 minutes" value="30min" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTimeCommitmentDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleSaveTimeCommitment}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
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
    marginTop: 32,
    marginBottom: 32,
  },
});
