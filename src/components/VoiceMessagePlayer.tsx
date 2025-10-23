import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Icon, ProgressBar } from "react-native-paper";
import { Message } from "@/types";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { formatDuration, formatMessageTime } from "@/utils/formatTime";

interface VoiceMessagePlayerProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function VoiceMessagePlayer({
  message,
  isOwnMessage,
}: VoiceMessagePlayerProps) {
  const { isPlaying, position, duration, loadAudio, playAudio, pauseAudio } =
    useAudioPlayback();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Load audio when component mounts
    loadAudio(message.content)
      .then(() => setIsLoaded(true))
      .catch((error) => console.error("Error loading audio:", error));
  }, [message.content]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const progress = duration > 0 ? position / duration : 0;
  const displayDuration = isPlaying
    ? formatDuration(position)
    : formatDuration(message.duration || 0);

  return (
    <View
      style={[
        styles.container,
        isOwnMessage
          ? styles.ownMessageContainer
          : styles.otherMessageContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
        ]}
      >
        {!isOwnMessage && (
          <Text variant="labelSmall" style={styles.senderName}>
            {message.senderName}
          </Text>
        )}

        <View style={styles.playerContent}>
          <TouchableOpacity
            onPress={handlePlayPause}
            disabled={!isLoaded}
            style={styles.playButton}
          >
            <Icon
              source={isPlaying ? "pause" : "play"}
              size={24}
              color={isOwnMessage ? "#fff" : "#333"}
            />
          </TouchableOpacity>

          <View style={styles.waveformContainer}>
            <ProgressBar
              progress={progress}
              color={isOwnMessage ? "#fff" : "#6200ee"}
              style={styles.progressBar}
            />
            <Text
              variant="labelSmall"
              style={[styles.duration, isOwnMessage && styles.ownMessageText]}
            >
              {displayDuration}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text
            variant="labelSmall"
            style={[styles.timestamp, isOwnMessage && styles.ownTimestamp]}
          >
            {formatMessageTime(message.timestamp)}
          </Text>
          {isOwnMessage && (
            <Icon
              source={message.status === "read" ? "check-all" : "check"}
              size={14}
              color={message.status === "read" ? "#4fc3f7" : "#ddd"}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  ownMessageContainer: {
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
    minWidth: 200,
  },
  ownMessageBubble: {
    backgroundColor: "#6200ee",
  },
  otherMessageBubble: {
    backgroundColor: "#e0e0e0",
  },
  senderName: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  playerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    marginRight: 12,
  },
  waveformContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  duration: {
    marginTop: 4,
    color: "#333",
    fontSize: 11,
  },
  ownMessageText: {
    color: "#fff",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  timestamp: {
    color: "#999",
    fontSize: 11,
  },
  ownTimestamp: {
    color: "#ddd",
  },
});
