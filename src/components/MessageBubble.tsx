import React from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Text, Icon } from "react-native-paper";
import { Message } from "@/types";
import { formatMessageTime } from "@/utils/formatTime";
import { zenDojoTheme } from "@/themes/zenDojo";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onRetry?: () => void;
}

export default function MessageBubble({
  message,
  isOwnMessage,
  onRetry,
}: MessageBubbleProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case "sending":
        return "clock-outline";
      case "sent":
        return "check";
      case "delivered":
        return "check-all";
      case "read":
        return "check-all";
      default:
        return null;
    }
  };

  const isUploading = message.status === "sending" && message.type === "voice";
  const isFailed = message.status === "failed";
  const statusIcon = getStatusIcon();

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
        <Text style={styles.messageText}>{message.content}</Text>
        <View style={styles.footer}>
          <Text variant="labelSmall" style={styles.timestamp}>
            {formatMessageTime(message.timestamp)}
          </Text>
          {isOwnMessage && (
            <>
              {isUploading && (
                <ActivityIndicator
                  size="small"
                  color={zenDojoTheme.colors.textDisabled}
                />
              )}
              {isFailed && (
                <TouchableOpacity
                  onPress={onRetry}
                  disabled={!onRetry}
                  style={styles.failedContainer}
                >
                  <Text variant="labelSmall" style={styles.failedText}>
                    Failed
                  </Text>
                  {onRetry && (
                    <Icon
                      source="reload"
                      size={14}
                      color={zenDojoTheme.colors.error}
                    />
                  )}
                </TouchableOpacity>
              )}
              {!isUploading && !isFailed && statusIcon && (
                <Icon
                  source={statusIcon}
                  size={14}
                  color={
                    message.status === "read"
                      ? zenDojoTheme.colors.primary
                      : zenDojoTheme.colors.textDisabled
                  }
                />
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: zenDojoTheme.spacing.xs,
    marginHorizontal: zenDojoTheme.spacing.md,
  },
  ownMessageContainer: {
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: zenDojoTheme.borderRadius.lg,
    padding: zenDojoTheme.spacing.md,
  },
  ownMessageBubble: {
    backgroundColor: zenDojoTheme.colors.messageSent,
  },
  otherMessageBubble: {
    backgroundColor: zenDojoTheme.colors.messageReceived,
  },
  senderName: {
    fontWeight: "600",
    marginBottom: zenDojoTheme.spacing.xs,
    color: zenDojoTheme.colors.textPrimary,
  },
  messageText: {
    fontSize: 16,
    color: zenDojoTheme.colors.background,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: zenDojoTheme.spacing.xs,
    gap: zenDojoTheme.spacing.xs,
  },
  timestamp: {
    color: zenDojoTheme.colors.background,
    opacity: 0.7,
    fontSize: 11,
  },
  failedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: zenDojoTheme.spacing.xs,
  },
  failedText: {
    color: zenDojoTheme.colors.error,
    fontSize: 11,
  },
});
