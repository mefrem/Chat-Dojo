import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  TextInput,
  IconButton,
  Appbar,
  Text,
  ActivityIndicator,
} from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToMessages,
  sendTextMessage,
  sendVoiceMessage,
  markMessagesAsRead,
} from "@/services/firestore";
import { uploadVoiceMessage } from "@/services/storage";
import { Message } from "@/types";
import MessageBubble from "@/components/MessageBubble";
import VoiceMessagePlayer from "@/components/VoiceMessagePlayer";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { addToOfflineQueue } from "@/services/offline";

interface ConversationScreenProps {
  navigation: any;
  route: {
    params: {
      conversationId: string;
    };
  };
}

export default function ConversationScreen({
  navigation,
  route,
}: ConversationScreenProps) {
  const { conversationId } = route.params;
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [isRecordingMode, setIsRecordingMode] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);

      // Mark messages as read
      if (user) {
        markMessagesAsRead(conversationId, user.uid);
      }
    });

    return () => unsubscribe();
  }, [conversationId, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendText = async () => {
    if (!textInput.trim() || !user) return;

    const messageContent = textInput.trim();
    setTextInput("");
    setSending(true);

    try {
      if (isOnline) {
        await sendTextMessage(
          conversationId,
          user.uid,
          user.displayName,
          messageContent
        );
      } else {
        // Queue message for offline sending
        await addToOfflineQueue({
          id: `temp_${Date.now()}`,
          conversationId,
          senderId: user.uid,
          senderName: user.displayName,
          type: "text",
          content: messageContent,
          timestamp: Date.now(),
        });
        Alert.alert(
          "Offline",
          "Message will be sent when connection is restored"
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleRecordingComplete = async (uri: string, duration: number) => {
    if (!user) return;

    setIsRecordingMode(false);
    setSending(true);

    try {
      if (isOnline) {
        // Upload voice message
        const downloadUrl = await uploadVoiceMessage(
          uri,
          conversationId,
          user.uid,
          (progress) => setUploadProgress(progress)
        );

        // Send voice message
        await sendVoiceMessage(
          conversationId,
          user.uid,
          user.displayName,
          downloadUrl,
          duration
        );
      } else {
        // Queue voice message for offline sending
        await addToOfflineQueue({
          id: `temp_${Date.now()}`,
          conversationId,
          senderId: user.uid,
          senderName: user.displayName,
          type: "voice",
          content: uri,
          timestamp: Date.now(),
          localUri: uri,
          duration,
        });
        Alert.alert(
          "Offline",
          "Voice message will be sent when connection is restored"
        );
      }
    } catch (error) {
      console.error("Error sending voice message:", error);
      Alert.alert("Error", "Failed to send voice message");
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  const handleRecordingCancel = () => {
    setIsRecordingMode(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.uid;

    if (item.type === "voice") {
      return <VoiceMessagePlayer message={item} isOwnMessage={isOwnMessage} />;
    }

    return <MessageBubble message={item} isOwnMessage={isOwnMessage} />;
  };

  const renderInputArea = () => {
    if (isRecordingMode) {
      return (
        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={handleRecordingCancel}
        />
      );
    }

    return (
      <>
        <IconButton
          icon="microphone"
          size={24}
          onPress={() => setIsRecordingMode(true)}
          disabled={sending}
        />
        <TextInput
          value={textInput}
          onChangeText={setTextInput}
          placeholder="Type a message..."
          mode="outlined"
          style={styles.textInput}
          disabled={sending}
          multiline
          maxLength={1000}
        />
        <IconButton
          icon="send"
          size={24}
          onPress={handleSendText}
          disabled={!textInput.trim() || sending}
        />
      </>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Conversation" />
      </Appbar.Header>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Offline - Messages will be sent when reconnected
          </Text>
        </View>
      )}

      {sending && uploadProgress > 0 && (
        <View style={styles.uploadProgress}>
          <Text style={styles.uploadText}>
            Uploading voice message... {Math.round(uploadProgress)}%
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>{renderInputArea()}</View>
    </KeyboardAvoidingView>
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
    fontSize: 12,
    fontWeight: "bold",
  },
  uploadProgress: {
    backgroundColor: "#4caf50",
    paddingVertical: 8,
    alignItems: "center",
  },
  uploadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  messageList: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  textInput: {
    flex: 1,
    marginHorizontal: 8,
    maxHeight: 100,
  },
});
