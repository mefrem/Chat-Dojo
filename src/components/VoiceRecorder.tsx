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
        <TouchableOpacity
          onPress={handleCancelRecording}
          style={styles.cancelButton}
        >
          <Icon source="close" size={24} color="#ff6b6b" />
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.recordingIndicator,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={styles.recordingDot} />
        </Animated.View>

        <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>

        <TouchableOpacity
          onPress={handleStopRecording}
          style={styles.stopButton}
        >
          <Icon source="send" size={24} color="#6200ee" />
        </TouchableOpacity>
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
    paddingHorizontal: 16,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cancelText: {
    color: "#ff6b6b",
    fontWeight: "bold",
  },
  recordingIndicator: {
    justifyContent: "center",
    alignItems: "center",
  },
  recordingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ff6b6b",
  },
  duration: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
  },
});
