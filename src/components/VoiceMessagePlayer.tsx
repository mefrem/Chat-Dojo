import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Icon, ProgressBar } from "react-native-paper";
import { Message } from "@/types";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { formatDuration, formatMessageTime } from "@/utils/formatTime";
import {
  savePlaybackPosition,
  getPlaybackPosition,
  clearPlaybackPosition,
} from "@/services/playback";

interface VoiceMessagePlayerProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function VoiceMessagePlayer({
  message,
  isOwnMessage,
}: VoiceMessagePlayerProps) {
  const {
    isPlaying,
    position,
    duration,
    loadAudio,
    playAudio,
    pauseAudio,
    seekAudio,
  } = useAudioPlayback();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [positionRestored, setPositionRestored] = useState<boolean>(false);
  const [showTranscription, setShowTranscription] = useState<boolean>(false);

  useEffect(() => {
    // Load audio when component mounts
    loadAudio(message.content)
      .then(() => setIsLoaded(true))
      .catch((error) => console.error("Error loading audio:", error));
  }, [message.content]);

  // Restore playback position after audio loads
  useEffect(() => {
    if (isLoaded && !positionRestored && duration > 0) {
      getPlaybackPosition(message.id).then((savedPosition) => {
        if (savedPosition && savedPosition.position > 1000) {
          // Only restore if more than 1 second
          seekAudio(savedPosition.position / 1000);
        }
        setPositionRestored(true);
      });
    }
  }, [isLoaded, duration, message.id, positionRestored]);

  // Save playback position while playing
  useEffect(() => {
    if (isPlaying && position > 0 && duration > 0) {
      const intervalId = setInterval(() => {
        savePlaybackPosition(message.id, position * 1000, duration * 1000);
      }, 3000); // Save every 3 seconds

      return () => clearInterval(intervalId);
    }
  }, [isPlaying, position, duration, message.id]);

  // Clear position when playback completes
  useEffect(() => {
    if (!isPlaying && position >= duration - 1 && duration > 0) {
      clearPlaybackPosition(message.id);
    }
  }, [isPlaying, position, duration, message.id]);

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

        {/* Transcription (if available) */}
        {message.transcription && (
          <View style={styles.transcriptionContainer}>
            <TouchableOpacity
              onPress={() => setShowTranscription(!showTranscription)}
              style={styles.transcriptionToggle}
            >
              <Icon
                source={showTranscription ? "chevron-up" : "chevron-down"}
                size={16}
                color={isOwnMessage ? "#fff" : "#666"}
              />
              <Text
                variant="labelSmall"
                style={[
                  styles.transcriptionLabel,
                  isOwnMessage && styles.ownTranscriptionLabel,
                ]}
              >
                {showTranscription ? "Hide" : "Show"} transcript
              </Text>
            </TouchableOpacity>
            {showTranscription && (
              <Text
                style={[
                  styles.transcriptionText,
                  isOwnMessage && styles.ownTranscriptionText,
                ]}
              >
                {message.transcription}
              </Text>
            )}
          </View>
        )}

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
  transcriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  transcriptionToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  transcriptionLabel: {
    marginLeft: 4,
    color: "#666",
    fontSize: 11,
  },
  ownTranscriptionLabel: {
    color: "#ddd",
  },
  transcriptionText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: "#333",
  },
  ownTranscriptionText: {
    color: "#f0f0f0",
  },
});
