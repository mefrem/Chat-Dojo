import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  FAB,
  Appbar,
  List,
  Badge,
  ActivityIndicator,
} from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToConversations,
  createConversation,
  getAllUsers,
} from "@/services/firestore";
import { Conversation, User } from "@/types";
import { formatMessageTime } from "@/utils/formatTime";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface ChatListScreenProps {
  navigation: any;
}

export default function ChatListScreen({ navigation }: ChatListScreenProps) {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate("Conversation", { conversationId: conversation.id });
  };

  const handleNewChat = async () => {
    try {
      // Get all users
      const allUsers = await getAllUsers();
      const otherUsers = allUsers.filter((u) => u.uid !== user?.uid);

      if (otherUsers.length === 0) {
        Alert.alert("No Users", "No other users available to chat with.");
        return;
      }

      // For simplicity, show a simple alert to select user
      // In a real app, you'd have a proper user selection screen
      const userNames = otherUsers.map((u) => u.displayName).join(", ");

      Alert.alert(
        "Start New Chat",
        `Available users: ${userNames}\n\nIn a complete app, you would see a user selection screen here.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Chat with first user",
            onPress: async () => {
              if (user) {
                const conversationId = await createConversation([
                  user.uid,
                  otherUsers[0].uid,
                ]);
                navigation.navigate("Conversation", { conversationId });
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to create conversation");
    }
  };

  const getConversationTitle = (conversation: Conversation): string => {
    if (conversation.type === "group" && conversation.groupName) {
      return conversation.groupName;
    }

    // For one-on-one, show the other participant's name
    const otherParticipants = conversation.participants.filter(
      (uid) => uid !== user?.uid
    );
    if (otherParticipants.length > 0) {
      const otherUid = otherParticipants[0];
      return (
        conversation.participantDetails[otherUid]?.displayName || "Unknown User"
      );
    }

    return "Conversation";
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity onPress={() => handleConversationPress(item)}>
      <List.Item
        title={getConversationTitle(item)}
        description={item.lastMessage || "No messages yet"}
        left={(props) => <List.Icon {...props} icon="chat" />}
        right={(props) => (
          <View style={styles.rightContent}>
            <Text variant="bodySmall" style={styles.timestamp}>
              {formatMessageTime(item.lastMessageTime)}
            </Text>
          </View>
        )}
      />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="titleLarge" style={styles.emptyTitle}>
        No conversations yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        Tap the + button to start a new chat
      </Text>
    </View>
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
        <Appbar.Content title="Chats" />
        <Appbar.Action
          icon="cog"
          onPress={() => navigation.navigate("Settings")}
        />
      </Appbar.Header>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      )}

      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          conversations.length === 0 ? styles.emptyListContent : undefined
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={handleNewChat} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  offlineBanner: {
    backgroundColor: "#ff6b6b",
    paddingVertical: 8,
    alignItems: "center",
  },
  offlineText: {
    color: "#fff",
    fontWeight: "bold",
  },
  rightContent: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  timestamp: {
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#666",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
