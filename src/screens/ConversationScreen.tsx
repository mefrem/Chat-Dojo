import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import {
  TextInput,
  IconButton,
  Appbar,
  Text,
  ActivityIndicator,
  Card,
  Chip,
} from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToMessages,
  sendTextMessage,
  sendVoiceMessage,
  markMessagesAsRead,
} from "@/services/firestore";
import { uploadVoiceMessage } from "@/services/storage";
import { Message, Reflection } from "@/types";
import { subscribeToReflectionByConversation } from "@/services/reflection";
import MessageBubble from "@/components/MessageBubble";
import VoiceMessagePlayer from "@/components/VoiceMessagePlayer";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useConversationAvailability } from "@/hooks/useAvailability";
import { addToOfflineQueue } from "@/services/offline";
import {
  saveDraftMessage,
  getDraftMessage,
  clearDraftMessage,
} from "@/services/drafts";
import {
  saveScrollPosition,
  getScrollPosition,
  clearScrollPosition,
} from "@/services/scrollPosition";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/config";
import { Button } from "react-native-paper";

interface ConversationScreenProps {
  navigation: any;
  route: {
    params: {
      conversationId: string;
    };
  };
}

const getSentimentColor = (sentiment: string): string => {
  switch (sentiment) {
    case "positive":
      return "#4caf50";
    case "neutral":
      return "#ff9800";
    case "challenging":
      return "#f44336";
    default:
      return "#9e9e9e";
  }
};

export default function ConversationScreen({
  navigation,
  route,
}: ConversationScreenProps) {
  const { conversationId } = route.params;
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Set user availability to "in-conversation"
  useConversationAvailability(conversationId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [isRecordingMode, setIsRecordingMode] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [scrollPositionRestored, setScrollPositionRestored] =
    useState<boolean>(false);
  const [showInsights, setShowInsights] = useState<boolean>(false);
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [generatingReflection, setGeneratingReflection] =
    useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);
  const previousMessageCountRef = useRef<number>(0);

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

  // Subscribe to live reflection/insights
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToReflectionByConversation(
      user.uid,
      conversationId,
      (reflectionData) => {
        setReflection(reflectionData);
      }
    );

    return () => unsubscribe();
  }, [conversationId, user]);

  // Load draft message on mount
  useEffect(() => {
    const loadDraft = async () => {
      const draft = await getDraftMessage(conversationId);
      if (draft && draft.content) {
        setTextInput(draft.content);
      }
    };
    loadDraft();
  }, [conversationId]);

  // Auto-save draft message (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (textInput.trim()) {
        saveDraftMessage(conversationId, textInput);
      } else {
        clearDraftMessage(conversationId);
      }
    }, 1000); // Save after 1 second of no typing

    return () => clearTimeout(timeoutId);
  }, [textInput, conversationId]);

  // Restore scroll position after messages load
  useEffect(() => {
    if (messages.length > 0 && !scrollPositionRestored && !loading) {
      getScrollPosition(conversationId).then((savedPosition) => {
        if (savedPosition && savedPosition.offset > 0) {
          // Restore to saved position
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: savedPosition.offset,
              animated: false,
            });
            setScrollPositionRestored(true);
          }, 500);
        } else {
          // No saved position, scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
            setScrollPositionRestored(true);
          }, 500);
        }
      });
    }
  }, [messages, scrollPositionRestored, loading, conversationId]);

  // Scroll to bottom only when NEW messages arrive (after initial load)
  useEffect(() => {
    if (
      scrollPositionRestored &&
      messages.length > previousMessageCountRef.current
    ) {
      // Only auto-scroll if user was near bottom (within 100px)
      // This prevents jumping when user is reading older messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    previousMessageCountRef.current = messages.length;
  }, [messages, scrollPositionRestored]);

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
      // Clear draft after successful send
      await clearDraftMessage(conversationId);
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

  const handleRetry = async (message: Message) => {
    if (!user) return;

    setSending(true);
    try {
      if (message.type === "text") {
        await sendTextMessage(
          conversationId,
          user.uid,
          user.displayName,
          message.content
        );
      } else if (message.type === "voice") {
        // For voice messages, we'd need to re-upload from local URI
        // This is a simplified version - in production, you'd retrieve from offline queue
        Alert.alert("Retry", "Please try recording the voice message again");
      }
    } catch (error) {
      console.error("Error retrying message:", error);
      Alert.alert("Error", "Failed to retry message");
    } finally {
      setSending(false);
    }
  };

  const handleGenerateReflection = async () => {
    if (!user || generatingReflection) return;

    setGeneratingReflection(true);
    try {
      const generateReflectionManual = httpsCallable(
        functions,
        "generateReflectionManual"
      );

      await generateReflectionManual({ conversationId });

      Alert.alert(
        "Success! 🎉",
        "AI insights generated! They should appear in a few seconds."
      );
    } catch (error) {
      console.error("Error generating reflection:", error);
      Alert.alert(
        "Error",
        "Failed to generate insights. Make sure you have at least one voice message with transcription."
      );
    } finally {
      setGeneratingReflection(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.uid;

    if (item.type === "voice") {
      return <VoiceMessagePlayer message={item} isOwnMessage={isOwnMessage} />;
    }

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        onRetry={() => handleRetry(item)}
      />
    );
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
        <Appbar.Content title={showInsights ? "Insights" : "Conversation"} />
        <Appbar.Action
          icon={showInsights ? "message" : "chart-line"}
          onPress={() => setShowInsights(!showInsights)}
        />
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

      {showInsights ? (
        <ScrollView style={styles.insightsContainer}>
          <Card style={styles.insightsCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.insightsTitle}>
                💬 Conversation Insights
              </Text>

              {/* Tier 1: Instant Stats - Always Available */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {messages.filter((m) => m.type === "voice").length}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Voice Messages
                  </Text>
                </View>
              </View>

              {/* Tier 2: AI Insights (if available) */}
              {reflection ? (
                <>
                  <View style={styles.divider} />

                  <View style={styles.statRow}>
                    <Text variant="titleMedium">Overall Sentiment</Text>
                    <Chip
                      mode="flat"
                      style={[
                        styles.sentimentChip,
                        {
                          backgroundColor: getSentimentColor(
                            reflection.sentiment
                          ),
                        },
                      ]}
                    >
                      {reflection.sentiment}
                    </Chip>
                  </View>

                  <View style={styles.insightsSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Key Themes
                    </Text>
                    <View style={styles.themesContainer}>
                      {reflection.themes.map((theme, index) => (
                        <Chip key={index} style={styles.themeChip}>
                          {theme}
                        </Chip>
                      ))}
                    </View>
                  </View>

                  <View style={styles.insightsSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      AI Insights
                    </Text>
                    <Text variant="bodyMedium" style={styles.insightsText}>
                      {reflection.insights}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.divider} />
                  <View style={styles.noInsights}>
                    {messages.length > 0 ? (
                      <>
                        <Text variant="bodyLarge" style={styles.noInsightsText}>
                          🤖 AI Insights Coming Soon
                        </Text>
                        <Text
                          variant="bodyMedium"
                          style={styles.noInsightsSubtext}
                        >
                          Keep chatting! AI insights are generated automatically
                          as your conversation develops. Check back in a few
                          minutes for sentiment analysis and key themes.
                        </Text>
                        {messages.filter((m) => m.type === "voice").length >
                          0 && (
                          <Button
                            mode="contained"
                            onPress={handleGenerateReflection}
                            style={styles.generateButton}
                            loading={generatingReflection}
                            disabled={generatingReflection}
                          >
                            {generatingReflection
                              ? "Generating..."
                              : "Generate Insights Now"}
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Text variant="bodyLarge" style={styles.noInsightsText}>
                          💬 Start the Conversation
                        </Text>
                        <Text
                          variant="bodyMedium"
                          style={styles.noInsightsSubtext}
                        >
                          Send messages to begin! AI-powered insights will
                          appear automatically as you chat.
                        </Text>
                      </>
                    )}
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onScroll={(event) => {
            // Save scroll position periodically
            const offset = event.nativeEvent.contentOffset.y;
            saveScrollPosition(conversationId, offset);
          }}
          scrollEventThrottle={1000} // Save at most once per second
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          }
        />
      )}

      {!showInsights && (
        <View style={styles.inputContainer}>{renderInputArea()}</View>
      )}
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
  insightsContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  insightsCard: {
    margin: 16,
    elevation: 2,
  },
  insightsTitle: {
    marginBottom: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  statBox: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  statValue: {
    fontWeight: "bold",
    color: "#6200ee",
  },
  statLabel: {
    marginTop: 4,
    color: "#666",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sentimentChip: {
    paddingHorizontal: 12,
  },
  insightsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "bold",
  },
  themesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  themeChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  insightsText: {
    lineHeight: 24,
    color: "#333",
  },
  noInsights: {
    padding: 32,
    alignItems: "center",
  },
  noInsightsText: {
    textAlign: "center",
    marginBottom: 12,
    color: "#666",
  },
  noInsightsSubtext: {
    textAlign: "center",
    color: "#999",
    lineHeight: 22,
  },
  generateButton: {
    marginTop: 24,
    alignSelf: "center",
    minWidth: 200,
  },
});
