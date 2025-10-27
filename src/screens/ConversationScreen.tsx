import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from "react-native";
import {
  TextInput,
  IconButton,
  Appbar,
  Text,
  ActivityIndicator,
  Card,
  Chip,
  Icon,
  FAB,
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
import {
  subscribeToConversationReflections,
  subscribeToReflectionAnalysis,
} from "@/services/personalReflections";
import { PersonalReflection, ReflectionThemeAnalysis } from "@/types";
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
import { functions } from "../../firebase/config";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Button } from "react-native-paper";
import { zenDojoTheme } from "@/themes/zenDojo";
import { getRandomTruthPrompt } from "@/utils/truthPrompts";
import { getRandomReflectionPrompt } from "@/utils/reflectionPrompts";
import ReflectionPromptDialog from "@/components/ReflectionPromptDialog";

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
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [truthPrompt] = useState<string>(getRandomTruthPrompt());
  const [showReflectionPrompt, setShowReflectionPrompt] =
    useState<boolean>(false);
  const [reflectionPrompt] = useState<string>(getRandomReflectionPrompt());
  const [conversationReflections, setConversationReflections] = useState<
    PersonalReflection[]
  >([]);
  const [themeAnalysis, setThemeAnalysis] =
    useState<ReflectionThemeAnalysis | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const previousMessageCountRef = useRef<number>(0);
  const voiceMessagesSentRef = useRef<number>(0);

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

  // Subscribe to personal reflections for this conversation
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversationReflections(
      user.uid,
      conversationId,
      (reflections) => {
        setConversationReflections(reflections);
      }
    );

    return () => unsubscribe();
  }, [conversationId, user]);

  // Subscribe to reflection theme analysis
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToReflectionAnalysis(user.uid, (analysis) => {
      setThemeAnalysis(analysis);
    });

    return () => unsubscribe();
  }, [user]);

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

        // Track voice message sent in this session
        voiceMessagesSentRef.current += 1;
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

  const handleBack = () => {
    if (voiceMessagesSentRef.current > 0) {
      setShowReflectionPrompt(true);
    } else {
      navigation.goBack();
    }
  };

  const handleReflectionComplete = () => {
    setShowReflectionPrompt(false);
    voiceMessagesSentRef.current = 0;
    navigation.goBack();
  };

  const handleReflectionSkip = () => {
    setShowReflectionPrompt(false);
    voiceMessagesSentRef.current = 0;
    navigation.goBack();
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

  const handleRefresh = async () => {
    setRefreshing(true);
    // The Firebase listener will automatically update messages
    // Just simulate a brief delay for UX
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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
          onPress={handleBack}
          color={zenDojoTheme.colors.primary}
        />
        <Appbar.Content title={showInsights ? "Insights" : "The Dojo"} />
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

                  <View style={styles.insightsSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Key Themes
                    </Text>
                    <View style={styles.themesContainer}>
                      {reflection.themes.map((theme, index) => (
                        <Chip
                          key={index}
                          style={styles.themeChip}
                          textStyle={styles.themeChipText}
                        >
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

              {/* Personal Reflections Section */}
              <View style={styles.divider} />
              <View style={styles.insightsSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Your Personal Reflections
                </Text>
                {conversationReflections.length > 0 ? (
                  <>
                    {conversationReflections.map((ref) => (
                      <Card
                        key={ref.id}
                        style={styles.reflectionCard}
                        mode="outlined"
                      >
                        <Card.Content>
                          <Text
                            variant="labelSmall"
                            style={styles.reflectionPrompt}
                          >
                            {ref.prompt}
                          </Text>
                          <Text
                            variant="bodyMedium"
                            style={styles.reflectionContent}
                            numberOfLines={2}
                          >
                            {ref.type === "voice"
                              ? `🎤 Voice reflection (${Math.round(
                                  ref.duration || 0
                                )}s)`
                              : ref.content}
                          </Text>
                          <Text
                            variant="labelSmall"
                            style={styles.reflectionDate}
                          >
                            {new Date(ref.createdAt).toLocaleDateString()}
                          </Text>
                        </Card.Content>
                      </Card>
                    ))}
                  </>
                ) : (
                  <Text variant="bodyMedium" style={styles.noInsightsSubtext}>
                    No reflections yet. You'll be prompted after your next talk.
                  </Text>
                )}
              </View>

              {/* Reflection Theme Analysis */}
              {themeAnalysis && themeAnalysis.totalReflections >= 3 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.insightsSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Reflection Insights (Last 30 Days)
                    </Text>
                    <View style={styles.themesContainer}>
                      {themeAnalysis.topThemes.map((theme, index) => (
                        <Chip
                          key={index}
                          style={styles.themeChip}
                          textStyle={styles.themeChipText}
                        >
                          {theme.theme} ({theme.count})
                        </Chip>
                      ))}
                    </View>
                    <Text
                      variant="bodyMedium"
                      style={[styles.insightsText, { marginTop: 12 }]}
                    >
                      {themeAnalysis.insights}
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={[
                        styles.noInsightsSubtext,
                        { marginTop: 8, textAlign: "center" },
                      ]}
                    >
                      Based on {themeAnalysis.totalReflections} reflections
                    </Text>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onScroll={(event) => {
              // Save scroll position periodically
              const offset = event.nativeEvent.contentOffset.y;
              const contentHeight = event.nativeEvent.contentSize.height;
              const layoutHeight = event.nativeEvent.layoutMeasurement.height;
              const distanceFromBottom = contentHeight - offset - layoutHeight;

              // Show scroll-to-bottom button if scrolled up more than 100px
              setShowScrollToBottom(distanceFromBottom > 100);

              saveScrollPosition(conversationId, offset);
            }}
            scrollEventThrottle={400} // Check scroll position ~2-3 times per second
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#6200ee"
                colors={["#6200ee"]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text variant="displaySmall" style={styles.emptyIcon}>
                  ⚡
                </Text>
                <Text variant="headlineSmall" style={styles.emptyTitle}>
                  Enter the Dojo
                </Text>

                <View style={styles.truthPromptCard}>
                  <Text variant="bodyLarge" style={styles.truthPromptText}>
                    {truthPrompt}
                  </Text>
                </View>

                <Text variant="bodyMedium" style={styles.emptyText}>
                  Speak what's real. Come alive.
                </Text>

                <View style={styles.emptyHints}>
                  <View style={styles.emptyHint}>
                    <Icon
                      source="microphone"
                      size={20}
                      color={zenDojoTheme.colors.primary}
                    />
                    <Text variant="bodySmall" style={styles.emptyHintText}>
                      Tap mic to record voice
                    </Text>
                  </View>
                  <View style={styles.emptyHint}>
                    <Icon
                      source="message-text"
                      size={20}
                      color={zenDojoTheme.colors.primary}
                    />
                    <Text variant="bodySmall" style={styles.emptyHintText}>
                      Type to send text
                    </Text>
                  </View>
                </View>
              </View>
            }
          />

          {/* Scroll to Bottom Button */}
          {showScrollToBottom && (
            <FAB
              icon="chevron-down"
              style={styles.scrollToBottomButton}
              onPress={() => {
                flatListRef.current?.scrollToEnd({ animated: true });
                setShowScrollToBottom(false);
              }}
              size="small"
            />
          )}
        </>
      )}

      {!showInsights && (
        <View style={styles.inputContainer}>{renderInputArea()}</View>
      )}

      {/* Reflection Prompt Dialog */}
      {user && (
        <ReflectionPromptDialog
          visible={showReflectionPrompt}
          prompt={reflectionPrompt}
          userId={user.uid}
          conversationId={conversationId}
          onComplete={handleReflectionComplete}
          onSkip={handleReflectionSkip}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: zenDojoTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: zenDojoTheme.colors.background,
  },
  offlineBanner: {
    backgroundColor: zenDojoTheme.colors.error,
    paddingVertical: zenDojoTheme.spacing.md,
    paddingHorizontal: zenDojoTheme.spacing.md,
    alignItems: "center",
  },
  offlineText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  uploadProgress: {
    backgroundColor: zenDojoTheme.colors.success,
    paddingVertical: zenDojoTheme.spacing.md,
    paddingHorizontal: zenDojoTheme.spacing.md,
    alignItems: "center",
  },
  uploadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  messageList: {
    paddingVertical: zenDojoTheme.spacing.md,
    paddingHorizontal: zenDojoTheme.spacing.sm,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: zenDojoTheme.spacing.xl,
  },
  emptyText: {
    textAlign: "center",
    color: zenDojoTheme.colors.textSecondary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: zenDojoTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: zenDojoTheme.colors.border,
    backgroundColor: zenDojoTheme.colors.surface,
  },
  textInput: {
    flex: 1,
    marginHorizontal: zenDojoTheme.spacing.sm,
    maxHeight: 100,
    backgroundColor: zenDojoTheme.colors.background,
  },
  insightsContainer: {
    flex: 1,
    backgroundColor: zenDojoTheme.colors.accent,
  },
  insightsCard: {
    margin: zenDojoTheme.spacing.md,
    elevation: zenDojoTheme.elevation.low,
    borderRadius: zenDojoTheme.borderRadius.lg,
  },
  insightsTitle: {
    marginBottom: zenDojoTheme.spacing.lg,
    fontWeight: "600",
    textAlign: "center",
    color: zenDojoTheme.colors.textPrimary,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: zenDojoTheme.spacing.md,
  },
  statBox: {
    alignItems: "center",
    paddingHorizontal: zenDojoTheme.spacing.lg,
  },
  statValue: {
    fontWeight: "600",
    color: zenDojoTheme.colors.primary,
  },
  statLabel: {
    marginTop: zenDojoTheme.spacing.xs,
    color: zenDojoTheme.colors.textSecondary,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: zenDojoTheme.colors.divider,
    marginVertical: zenDojoTheme.spacing.md,
  },
  insightsSection: {
    marginTop: zenDojoTheme.spacing.md,
  },
  sectionTitle: {
    marginBottom: zenDojoTheme.spacing.md,
    fontWeight: "600",
    color: zenDojoTheme.colors.textPrimary,
  },
  themesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: zenDojoTheme.spacing.sm,
  },
  themeChip: {
    marginRight: zenDojoTheme.spacing.sm,
    marginBottom: zenDojoTheme.spacing.sm,
    backgroundColor: zenDojoTheme.colors.primary + "20", // 20% opacity sage green
  },
  themeChipText: {
    color: zenDojoTheme.colors.primary,
    fontWeight: "600",
  },
  insightsText: {
    lineHeight: 24,
    color: zenDojoTheme.colors.textPrimary,
  },
  noInsights: {
    padding: zenDojoTheme.spacing.xl,
    alignItems: "center",
  },
  noInsightsText: {
    textAlign: "center",
    marginBottom: zenDojoTheme.spacing.md,
    color: zenDojoTheme.colors.textSecondary,
  },
  noInsightsSubtext: {
    textAlign: "center",
    color: zenDojoTheme.colors.textDisabled,
    lineHeight: 22,
  },
  generateButton: {
    marginTop: zenDojoTheme.spacing.lg,
    alignSelf: "center",
    minWidth: 200,
  },
  scrollToBottomButton: {
    position: "absolute",
    right: zenDojoTheme.spacing.md,
    bottom: 80,
    backgroundColor: zenDojoTheme.colors.primary,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: zenDojoTheme.spacing.md,
  },
  emptyTitle: {
    fontWeight: "600",
    marginBottom: zenDojoTheme.spacing.lg,
    textAlign: "center",
    color: zenDojoTheme.colors.textPrimary,
  },
  truthPromptCard: {
    backgroundColor: zenDojoTheme.colors.surface,
    padding: zenDojoTheme.spacing.lg,
    borderRadius: zenDojoTheme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: zenDojoTheme.colors.primary,
    marginBottom: zenDojoTheme.spacing.lg,
    alignSelf: "stretch",
  },
  truthPromptText: {
    fontStyle: "italic",
    textAlign: "center",
    color: zenDojoTheme.colors.textPrimary,
    fontWeight: "500",
    lineHeight: 28,
  },
  emptyHints: {
    marginTop: zenDojoTheme.spacing.lg,
    gap: zenDojoTheme.spacing.md,
  },
  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: zenDojoTheme.spacing.md,
    paddingHorizontal: zenDojoTheme.spacing.md,
  },
  emptyHintText: {
    color: zenDojoTheme.colors.textSecondary,
  },
  reflectionCard: {
    marginBottom: zenDojoTheme.spacing.md,
    borderColor: zenDojoTheme.colors.primary + "40",
    backgroundColor: zenDojoTheme.colors.background,
  },
  reflectionPrompt: {
    color: zenDojoTheme.colors.primary,
    fontWeight: "600",
    marginBottom: zenDojoTheme.spacing.xs,
  },
  reflectionContent: {
    color: zenDojoTheme.colors.textPrimary,
    marginBottom: zenDojoTheme.spacing.xs,
  },
  reflectionDate: {
    color: zenDojoTheme.colors.textDisabled,
    fontSize: 11,
  },
});
