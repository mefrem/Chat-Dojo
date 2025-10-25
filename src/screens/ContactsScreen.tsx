import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput as RNTextInput,
} from "react-native";
import {
  Appbar,
  Text,
  Card,
  Button,
  Dialog,
  Portal,
  TextInput,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";
import { Contact } from "@/types";
import {
  subscribeToContacts,
  blockContact,
  unblockContact,
  deleteContact,
} from "@/services/contacts";
import { getUserByPartnerCode } from "@/services/user";
import { requestDirectMatch } from "@/services/matching";

interface ContactsScreenProps {
  navigation: any;
}

export default function ContactsScreen({ navigation }: ContactsScreenProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [addingContact, setAddingContact] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToContacts(user.uid, (fetchedContacts) => {
      setContacts(fetchedContacts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddByCode = async () => {
    if (!user) return;
    if (!partnerCode.trim()) {
      Alert.alert("Error", "Please enter a partner code");
      return;
    }

    setAddingContact(true);

    try {
      // Look up partner by code
      const partner = await getUserByPartnerCode(
        partnerCode.trim().toUpperCase()
      );

      if (!partner) {
        Alert.alert("Not Found", "No user found with that partner code.");
        setAddingContact(false);
        return;
      }

      if (partner.uid === user.uid) {
        Alert.alert("Error", "You cannot add yourself as a contact!");
        setAddingContact(false);
        return;
      }

      // Send direct match request
      await requestDirectMatch(
        user.uid,
        user.displayName,
        partner.uid,
        partner.displayName
      );

      Alert.alert(
        "Request Sent!",
        `Match request sent to ${partner.displayName}. They'll receive a notification.`
      );

      setAddDialogVisible(false);
      setPartnerCode("");
    } catch (error) {
      console.error("Error adding contact:", error);
      Alert.alert("Error", "Failed to send match request. Please try again.");
    } finally {
      setAddingContact(false);
    }
  };

  const handleRequestMatch = async (contact: Contact) => {
    if (!user) return;

    try {
      await requestDirectMatch(
        user.uid,
        user.displayName,
        contact.id,
        contact.displayName
      );

      Alert.alert(
        "Request Sent!",
        `Match request sent to ${contact.displayName}.`
      );
    } catch (error) {
      console.error("Error requesting match:", error);
      Alert.alert("Error", "Failed to send match request.");
    }
  };

  const handleBlockContact = (contact: Contact) => {
    if (!user) return;

    Alert.alert(
      "Block Contact",
      `Are you sure you want to block ${contact.displayName}? You won't be matched with them again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await blockContact(user.uid, contact.id);
              Alert.alert(
                "Blocked",
                `${contact.displayName} has been blocked.`
              );
            } catch (error) {
              console.error("Error blocking contact:", error);
              Alert.alert("Error", "Failed to block contact.");
            }
          },
        },
      ]
    );
  };

  const getAvailabilityColor = (availability?: string) => {
    switch (availability) {
      case "online":
        return "#4CAF50";
      case "in-conversation":
        return "#FF9800";
      case "offline":
      default:
        return "#9E9E9E";
    }
  };

  const getAvailabilityText = (availability?: string) => {
    switch (availability) {
      case "online":
        return "Online";
      case "in-conversation":
        return "In Chat";
      case "offline":
      default:
        return "Offline";
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <Card style={styles.contactCard}>
      <Card.Content>
        <View style={styles.contactHeader}>
          <View style={styles.contactInfo}>
            <Text variant="titleMedium" style={styles.contactName}>
              {item.displayName}
            </Text>
            <Chip
              icon="circle"
              compact
              style={{
                ...styles.statusChip,
                backgroundColor: `${getAvailabilityColor(item.availability)}20`,
              }}
              textStyle={{ color: getAvailabilityColor(item.availability) }}
            >
              {getAvailabilityText(item.availability)}
            </Chip>
          </View>
          <Text variant="bodySmall" style={styles.partnerCode}>
            {item.partnerCode}
          </Text>
        </View>

        {item.lastConversationDate && (
          <Text variant="bodySmall" style={styles.lastConversation}>
            Last chat:{" "}
            {new Date(item.lastConversationDate).toLocaleDateString()}
          </Text>
        )}
      </Card.Content>

      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => handleRequestMatch(item)}
          disabled={item.availability === "in-conversation"}
        >
          Request Match
        </Button>
        <Button onPress={() => handleBlockContact(item)}>Block</Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
        <Appbar.Content title="My Contacts" />
        <Appbar.Action icon="plus" onPress={() => setAddDialogVisible(true)} />
      </Appbar.Header>

      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={styles.emptyText}>
            No contacts yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Add partners by their code to stay connected
          </Text>
          <Button
            mode="contained"
            onPress={() => setAddDialogVisible(true)}
            style={styles.addButton}
          >
            Add Your First Contact
          </Button>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <Portal>
        <Dialog
          visible={addDialogVisible}
          onDismiss={() => setAddDialogVisible(false)}
        >
          <Dialog.Title>Add Contact by Code</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Partner Code"
              value={partnerCode}
              onChangeText={setPartnerCode}
              placeholder="DOJO-XXXXX"
              autoCapitalize="characters"
              style={styles.input}
            />
            <Text variant="bodySmall" style={styles.hint}>
              Enter the partner code shared by the person you want to add
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleAddByCode}
              loading={addingContact}
              disabled={addingContact}
            >
              Send Request
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
  },
  contactCard: {
    marginBottom: 12,
  },
  contactHeader: {
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactName: {
    fontWeight: "bold",
    marginRight: 8,
  },
  statusChip: {
    height: 24,
  },
  partnerCode: {
    color: "#666",
    fontFamily: "monospace",
  },
  lastConversation: {
    color: "#666",
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  addButton: {
    marginTop: 16,
  },
  input: {
    marginBottom: 8,
  },
  hint: {
    color: "#666",
    marginTop: 8,
  },
});
