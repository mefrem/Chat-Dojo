import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Text, Icon } from "react-native-paper";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { formatDuration } from "@/utils/formatTime";

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({
  onRecordingComplete,
  onCancel,
}: VoiceRecorderProps) {
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecording();
  const [pulseAnim] = useState(new Animated.Value(1));

  const handleStartRecording = async () => {
    try {
      await startRecording();

      // Animate pulse effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const handleStopRecording = async () => {
    try {
      const result = await stopRecording();
      if (result) {
        onRecordingComplete(result.uri || "", result.duration);
      }
      pulseAnim.setValue(1);
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  const handleCancelRecording = async () => {
    await cancelRecording();
    pulseAnim.setValue(1);
    onCancel();
  };

  if (isRecording) {
    return (
      <View style={styles.recordingContainer}>
        <View style={styles.recordingContent}>
          <Animated.View
            style={[
              styles.recordingIndicator,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.recordingDot} />
          </Animated.View>

          <View style={styles.recordingInfo}>
            <Text style={styles.recordingLabel}>Recording...</Text>
            <Text style={styles.duration}>
              {formatDuration(recordingDuration)}
            </Text>
          </View>
        </View>

        <View style={styles.recordingActions}>
          <TouchableOpacity
            onPress={handleCancelRecording}
            style={styles.cancelButton}
          >
            <Icon source="close" size={24} color="#ff6b6b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStopRecording}
            style={styles.stopButton}
          >
            <Icon source="send" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleStartRecording}
      style={styles.micButton}
      activeOpacity={0.7}
    >
      <Icon source="microphone" size={28} color="#6200ee" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff8f8",
    borderRadius: 24,
  },
  recordingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  recordingIndicator: {
    justifyContent: "center",
    alignItems: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffe0e0",
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ff6b6b",
  },
  recordingInfo: {
    flex: 1,
  },
  recordingLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  duration: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff6b6b",
    fontVariant: ["tabular-nums"],
  },
  recordingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff6b6b",
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6200ee",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
