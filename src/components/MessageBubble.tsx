import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon } from "react-native-paper";
import { Message } from "@/types";
import { formatMessageTime } from "@/utils/formatTime";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageBubble({
  message,
  isOwnMessage,
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
          {isOwnMessage && statusIcon && (
            <Icon
              source={statusIcon}
              size={14}
              color={message.status === "read" ? "#4fc3f7" : "#999"}
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
  },
  ownMessageBubble: {
    backgroundColor: "#6200ee",
  },
  otherMessageBubble: {
    backgroundColor: "#e0e0e0",
  },
  senderName: {
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    color: "#ddd",
    fontSize: 11,
  },
});
