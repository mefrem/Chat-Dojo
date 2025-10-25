import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import {
  Text,
  Appbar,
  ActivityIndicator,
  Card,
  Chip,
  SegmentedButtons,
} from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToReflections,
  subscribeToReflectionsBySentiment,
} from "@/services/reflection";
import { Reflection } from "@/types";
import { formatMessageTime } from "@/utils/formatTime";

interface PastReflectionsScreenProps {
  navigation: any;
}

export default function PastReflectionsScreen({
  navigation,
}: PastReflectionsScreenProps) {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterSentiment, setFilterSentiment] = useState<string>("all");

  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | undefined;

    if (filterSentiment === "all") {
      unsubscribe = subscribeToReflections(user.uid, (data) => {
        setReflections(data);
        setLoading(false);
      });
    } else {
      unsubscribe = subscribeToReflectionsBySentiment(
        user.uid,
        filterSentiment as "positive" | "neutral" | "challenging",
        (data) => {
          setReflections(data);
          setLoading(false);
        }
      );
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, filterSentiment]);

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

  const renderReflectionCard = ({ item }: { item: Reflection }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("PostConversation", {
            conversationId: item.conversationId,
          })
        }
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.sentimentIcon}>
                  {getSentimentIcon(item.sentiment)}
                </Text>
                <View>
                  <Text variant="labelLarge" style={styles.dateText}>
                    {formatMessageTime(item.createdAt)}
                  </Text>
                  <Chip
                    style={[
                      styles.sentimentChip,
                      { backgroundColor: getSentimentColor(item.sentiment) },
                    ]}
                    textStyle={styles.sentimentChipText}
                  >
                    {item.sentiment}
                  </Chip>
                </View>
              </View>
              {item.userFeeling && (
                <Text style={styles.userFeeling}>
                  {item.userFeeling === "good"
                    ? "💪"
                    : item.userFeeling === "challenging"
                    ? "😓"
                    : "😐"}
                </Text>
              )}
            </View>

            <Text style={styles.insights} numberOfLines={3}>
              {item.insights}
            </Text>

            {item.themes && item.themes.length > 0 && (
              <View style={styles.themesRow}>
                {item.themes.slice(0, 3).map((theme, index) => (
                  <Chip key={index} compact style={styles.themeChip}>
                    {theme}
                  </Chip>
                ))}
                {item.themes.length > 3 && (
                  <Text style={styles.moreThemes}>
                    +{item.themes.length - 3} more
                  </Text>
                )}
              </View>
            )}

            {item.userNote && (
              <Text style={styles.userNote} numberOfLines={2}>
                💭 "{item.userNote}"
              </Text>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleGoBack} color="#6200ee" />
          <Appbar.Content title="Past Reflections" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleGoBack} />
        <Appbar.Content title="Past Reflections" />
      </Appbar.Header>

      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filterSentiment}
          onValueChange={setFilterSentiment}
          buttons={[
            { value: "all", label: "All" },
            { value: "positive", label: "😊 Positive" },
            { value: "neutral", label: "💭 Neutral" },
            { value: "challenging", label: "💪 Challenging" },
          ]}
        />
      </View>

      <FlatList
        data={reflections}
        renderItem={renderReflectionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No reflections yet.
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Complete conversations to receive AI-generated reflections.
            </Text>
          </View>
        }
      />
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
  filterContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sentimentIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  dateText: {
    color: "#666",
    marginBottom: 4,
  },
  sentimentChip: {
    alignSelf: "flex-start",
  },
  sentimentChipText: {
    color: "#fff",
    fontSize: 10,
  },
  userFeeling: {
    fontSize: 24,
  },
  insights: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
    marginBottom: 12,
  },
  themesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  themeChip: {
    marginRight: 4,
    marginBottom: 4,
    height: 24,
  },
  moreThemes: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  userNote: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#666",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: "center",
    color: "#999",
  },
});
