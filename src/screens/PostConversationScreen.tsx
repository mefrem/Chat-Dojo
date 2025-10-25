import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Appbar,
  Card,
  Chip,
} from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToReflectionByConversation,
  updateReflectionResponse,
} from "@/services/reflection";
import { Reflection } from "@/types";

interface PostConversationScreenProps {
  navigation: any;
  route: {
    params: {
      conversationId: string;
    };
  };
}

export default function PostConversationScreen({
  navigation,
  route,
}: PostConversationScreenProps) {
  const { conversationId } = route.params;
  const { user } = useAuth();
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFeeling, setSelectedFeeling] = useState<
    "good" | "neutral" | "challenging" | null
  >(null);
  const [userNote, setUserNote] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;

    // Set a timeout to stop loading after 10 seconds
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const unsubscribe = subscribeToReflectionByConversation(
      user.uid,
      conversationId,
      (reflectionData) => {
        clearTimeout(loadingTimeout);
        setReflection(reflectionData);
        setLoading(false);

        // Pre-fill if already responded
        if (reflectionData?.userFeeling) {
          setSelectedFeeling(reflectionData.userFeeling);
        }
        if (reflectionData?.userNote) {
          setUserNote(reflectionData.userNote);
        }
      }
    );

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [conversationId, user]);

  const handleSaveResponse = async () => {
    if (!user || !reflection || !selectedFeeling) return;

    setSaving(true);
    try {
      await updateReflectionResponse(
        user.uid,
        reflection.id,
        selectedFeeling,
        userNote.trim() || undefined
      );

      Alert.alert("Saved", "Your reflection has been saved", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error saving reflection:", error);
      Alert.alert("Error", "Failed to save your reflection");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "#4caf50";
      case "challenging":
        return "#ff9800";
      default:
        return "#2196f3";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "😊";
      case "challenging":
        return "💪";
      default:
        return "💭";
    }
  };

  const handleGoBack = () => {
    // Always navigate to Home screen, not back to the conversation
    navigation.navigate("Home");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleGoBack} color="#6200ee" />
          <Appbar.Content title="Reflection" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Generating your reflection...</Text>
        </View>
      </View>
    );
  }

  if (!reflection) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleGoBack} color="#6200ee" />
          <Appbar.Content title="Reflection" />
        </Appbar.Header>
        <View style={styles.emptyContainer}>
          <Text variant="titleLarge" style={styles.emptyTitle}>
            ✨ Reflection Coming Soon
          </Text>
          <Text style={styles.emptyText}>
            Your AI-generated reflection will appear here within a few minutes
            after your conversation ends. It will include insights, themes, and
            personalized reflections on your chat.
          </Text>
          <Text style={styles.emptySubtext}>
            Check back soon or view your past reflections from the Settings
            menu.
          </Text>
          <Button mode="contained" onPress={handleGoBack} style={styles.button}>
            Back to Home
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleGoBack} />
        <Appbar.Content title="Your Reflection" />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* How did that feel? Prompt */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.promptTitle}>
              How did that feel?
            </Text>
            <View style={styles.feelingOptions}>
              <TouchableOpacity
                style={[
                  styles.feelingButton,
                  selectedFeeling === "good" && styles.feelingButtonSelected,
                ]}
                onPress={() => setSelectedFeeling("good")}
              >
                <Text style={styles.feelingEmoji}>💪</Text>
                <Text style={styles.feelingLabel}>Good</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.feelingButton,
                  selectedFeeling === "neutral" && styles.feelingButtonSelected,
                ]}
                onPress={() => setSelectedFeeling("neutral")}
              >
                <Text style={styles.feelingEmoji}>😐</Text>
                <Text style={styles.feelingLabel}>Neutral</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.feelingButton,
                  selectedFeeling === "challenging" &&
                    styles.feelingButtonSelected,
                ]}
                onPress={() => setSelectedFeeling("challenging")}
              >
                <Text style={styles.feelingEmoji}>😓</Text>
                <Text style={styles.feelingLabel}>Challenging</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={userNote}
              onChangeText={setUserNote}
              placeholder="Add a personal note (optional)..."
              mode="outlined"
              multiline
              numberOfLines={3}
              maxLength={280}
              style={styles.noteInput}
            />
          </Card.Content>
        </Card>

        {/* AI-Generated Reflection */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.reflectionHeader}>
              <Text style={styles.reflectionIcon}>
                {getSentimentIcon(reflection.sentiment)}
              </Text>
              <View style={styles.reflectionTitleContainer}>
                <Text variant="titleMedium" style={styles.reflectionTitle}>
                  Your AI Reflection
                </Text>
                <Chip
                  style={[
                    styles.sentimentChip,
                    {
                      backgroundColor: getSentimentColor(reflection.sentiment),
                    },
                  ]}
                  textStyle={styles.sentimentChipText}
                >
                  {reflection.sentiment}
                </Chip>
              </View>
            </View>

            <Text style={styles.insights}>{reflection.insights}</Text>

            {reflection.themes && reflection.themes.length > 0 && (
              <View style={styles.themesContainer}>
                <Text variant="labelLarge" style={styles.themesLabel}>
                  Key Themes:
                </Text>
                <View style={styles.themesChips}>
                  {reflection.themes.map((theme, index) => (
                    <Chip key={index} style={styles.themeChip}>
                      {theme}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {reflection.messageCount && (
              <Text variant="labelSmall" style={styles.metadata}>
                Based on {reflection.messageCount} messages
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleSaveResponse}
            disabled={!selectedFeeling || saving}
            loading={saving}
            style={styles.saveButton}
          >
            Save Reflection
          </Button>
          <Button mode="text" onPress={handleSkip} disabled={saving}>
            Skip
          </Button>
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
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptySubtext: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  button: {
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  promptTitle: {
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "bold",
  },
  feelingOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  feelingButton: {
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    minWidth: 100,
  },
  feelingButtonSelected: {
    borderColor: "#6200ee",
    backgroundColor: "#f3e5f5",
  },
  feelingEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  feelingLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  noteInput: {
    marginTop: 8,
  },
  reflectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  reflectionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  reflectionTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reflectionTitle: {
    fontWeight: "bold",
  },
  sentimentChip: {
    marginLeft: 8,
  },
  sentimentChipText: {
    color: "#fff",
    fontSize: 11,
  },
  insights: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 16,
  },
  themesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  themesLabel: {
    marginBottom: 8,
    color: "#666",
  },
  themesChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  themeChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  metadata: {
    marginTop: 8,
    color: "#999",
    textAlign: "right",
  },
  actions: {
    marginTop: 8,
  },
  saveButton: {
    marginBottom: 8,
  },
});
