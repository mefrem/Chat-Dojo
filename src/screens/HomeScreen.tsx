import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import {
  Text,
  Button,
  Appbar,
  Card,
  ActivityIndicator,
  Dialog,
  Portal,
  RadioButton,
  Chip,
} from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToConversations } from "@/services/firestore";
import { Conversation, Contact } from "@/types";
import { formatMessageTime } from "@/utils/formatTime";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  requestRandomMatch,
  cancelMatchRequest,
  subscribeToMatchRequest,
} from "@/services/matching";
import { subscribeToContacts } from "@/services/contacts";
import { getUserDoc } from "@/services/user";

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [findingMatch, setFindingMatch] = useState(false);
  const [currentMatchRequestId, setCurrentMatchRequestId] = useState<
    string | null
  >(null);
  const [streakDays, setStreakDays] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    // Subscribe to conversations
    const unsubConversations = subscribeToConversations(user.uid, (convs) => {
      // Filter for active conversations only
      const activeConvs = convs.filter((c) => c.state !== "archived");
      setConversations(activeConvs);
      setLoading(false);
    });

    // Subscribe to contacts
    const unsubContacts = subscribeToContacts(user.uid, (fetchedContacts) => {
      setContacts(fetchedContacts.slice(0, 3)); // Show top 3
    });

    // Load user's streak data
    loadStreakData();

    return () => {
      unsubConversations();
      unsubContacts();
    };
  }, [user]);

  const loadStreakData = async () => {
    if (!user) return;
    try {
      const userDoc = await getUserDoc(user.uid);
      if (userDoc) {
        setStreakDays(userDoc.streakDays || 0);
      }
    } catch (error) {
      console.error("Error loading streak data:", error);
    }
  };

  // Subscribe to match request when searching
  useEffect(() => {
    if (!currentMatchRequestId) return;

    const unsubscribe = subscribeToMatchRequest(
      currentMatchRequestId,
      (matchRequest) => {
        if (!matchRequest) {
          // Match request was deleted (either matched or expired)
          setFindingMatch(false);
          setCurrentMatchRequestId(null);
          return;
        }

        if (matchRequest.status === "matched" && matchRequest.conversationId) {
          // Match found!
          setFindingMatch(false);
          setCurrentMatchRequestId(null);
          navigation.navigate("Conversation", {
            conversationId: matchRequest.conversationId,
          });
        }
      }
    );

    return () => unsubscribe();
  }, [currentMatchRequestId]);

  const handleFindPartner = async () => {
    if (!user) return;

    setFindingMatch(true);

    try {
      const result = await requestRandomMatch(
        user.uid,
        user.displayName || "Anonymous"
      );

      setFindingMatch(false);

      if (result.matched && result.conversationId) {
        // Matched immediately!
        Alert.alert("Match Found! 🎉", "You've been matched with a partner!", [
          {
            text: "Start Conversation",
            onPress: () =>
              navigation.navigate("Conversation", {
                conversationId: result.conversationId,
              }),
          },
        ]);
      } else if (result.matchRequestId) {
        // Request created, will match later
        Alert.alert(
          "Looking for a Partner",
          "You're in the matching queue! We'll notify you when we find a partner. Check back soon or keep the app open.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error requesting match:", error);
      Alert.alert("Error", "Failed to find a partner. Please try again.");
      setFindingMatch(false);
    }
  };

  const handleCancelMatch = async () => {
    if (currentMatchRequestId) {
      try {
        await cancelMatchRequest(currentMatchRequestId);
        setCurrentMatchRequestId(null);
      } catch (error) {
        console.error("Error canceling match:", error);
      }
    }
    setFindingMatch(false);
  };

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate("Conversation", { conversationId: conversation.id });
  };

  const getPartnerName = (conversation: Conversation): string => {
    if (!user) return "Unknown";
    const partnerId = conversation.participants.find((id) => id !== user.uid);
    return partnerId
      ? conversation.participantDetails[partnerId]?.displayName || "Unknown"
      : "Unknown";
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity onPress={() => handleConversationPress(item)}>
      <Card style={styles.conversationCard}>
        <Card.Content>
          <View style={styles.conversationHeader}>
            <Text variant="titleMedium" style={styles.partnerName}>
              {getPartnerName(item)}
            </Text>
            <Text variant="bodySmall" style={styles.timestamp}>
              {formatMessageTime(item.lastMessageTime)}
            </Text>
          </View>
          <Text
            variant="bodyMedium"
            numberOfLines={1}
            style={styles.lastMessage}
          >
            {item.lastMessage || "No messages yet"}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderContact = ({ item }: { item: Contact }) => (
    <Card style={styles.contactCard}>
      <Card.Content>
        <Text variant="titleSmall">{item.displayName}</Text>
        <Chip
          icon="circle"
          compact
          style={{
            ...styles.statusChip,
            backgroundColor:
              item.availability === "online" ? "#4CAF5020" : "#9E9E9E20",
          }}
          textStyle={{
            color: item.availability === "online" ? "#4CAF50" : "#9E9E9E",
          }}
        >
          {item.availability === "online" ? "Online" : "Offline"}
        </Chip>
      </Card.Content>
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
        <Appbar.Content title="Chat Dojo" />
        <Appbar.Action
          icon="account-cog"
          onPress={() => navigation.navigate("Settings")}
        />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Offline Banner */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              You're offline. Messages will send when reconnected.
            </Text>
          </View>
        )}

        {/* Streak Indicator */}
        {streakDays > 0 && (
          <Card style={styles.streakCard}>
            <Card.Content style={styles.streakContent}>
              <View style={styles.streakIcon}>
                <Text style={styles.streakEmoji}>🔥</Text>
              </View>
              <View style={styles.streakInfo}>
                <Text variant="headlineMedium" style={styles.streakNumber}>
                  {streakDays} {streakDays === 1 ? "day" : "days"}
                </Text>
                <Text variant="bodySmall" style={styles.streakLabel}>
                  Conversation streak!
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Find Partner Section */}
        <View style={styles.findPartnerSection}>
          <Text variant="headlineMedium" style={styles.sectionTitle}>
            Start a Conversation
          </Text>
          <Button
            mode="contained"
            onPress={handleFindPartner}
            style={styles.findPartnerButton}
            contentStyle={styles.findPartnerButtonContent}
            disabled={findingMatch || !isOnline}
            loading={findingMatch}
          >
            {findingMatch ? "Finding Partner..." : "Find Partner"}
          </Button>
        </View>

        {/* Recent Contacts */}
        {contacts.length > 0 && (
          <View style={styles.contactsSection}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium">Quick Access</Text>
              <Button onPress={() => navigation.navigate("Contacts")}>
                View All
              </Button>
            </View>
            <FlatList
              data={contacts}
              renderItem={renderContact}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contactsList}
            />
          </View>
        )}

        {/* Recent Conversations */}
        <View style={styles.conversationsSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Recent Conversations
          </Text>
          {conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No conversations yet. Tap "Find Partner" to start!
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  offlineBanner: {
    backgroundColor: "#ff6b6b",
    padding: 12,
    alignItems: "center",
  },
  offlineText: {
    color: "#fff",
    fontSize: 14,
  },
  streakCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    elevation: 2,
  },
  streakContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  streakIcon: {
    marginRight: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontWeight: "bold",
    color: "#FF6F00",
  },
  streakLabel: {
    color: "#666",
    marginTop: 2,
  },
  findPartnerSection: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: "bold",
  },
  findPartnerButton: {
    width: "100%",
    borderRadius: 12,
  },
  findPartnerButtonContent: {
    paddingVertical: 8,
  },
  timeCommitmentHint: {
    marginTop: 8,
    color: "#666",
  },
  contactsSection: {
    padding: 16,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  contactsList: {
    paddingRight: 16,
  },
  contactCard: {
    width: 120,
    marginRight: 12,
  },
  statusChip: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  conversationsSection: {
    padding: 16,
    marginTop: 8,
  },
  conversationCard: {
    marginBottom: 12,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  partnerName: {
    fontWeight: "bold",
  },
  timestamp: {
    color: "#666",
  },
  lastMessage: {
    color: "#666",
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
  },
  findingMatchContent: {
    alignItems: "center",
    padding: 16,
  },
  findingMatchText: {
    marginTop: 16,
    marginBottom: 8,
  },
  findingMatchSubtext: {
    color: "#666",
    textAlign: "center",
  },
});
