import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Dialog,
  Portal,
  Text,
  Button,
  TextInput,
  SegmentedButtons,
  ActivityIndicator,
} from "react-native-paper";
import { zenDojoTheme } from "@/themes/zenDojo";
import VoiceRecorder from "./VoiceRecorder";
import { saveReflection } from "@/services/personalReflections";
import { uploadVoiceMessage } from "@/services/storage";

interface ReflectionPromptDialogProps {
  visible: boolean;
  prompt: string;
  userId: string;
  conversationId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export default function ReflectionPromptDialog({
  visible,
  prompt,
  userId,
  conversationId,
  onComplete,
  onSkip,
}: ReflectionPromptDialogProps) {
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [textContent, setTextContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleVoiceRecordingComplete = async (
    uri: string,
    duration: number
  ) => {
    setIsRecording(false);
    setSaving(true);

    try {
      // Upload voice recording
      const voiceUrl = await uploadVoiceMessage(
        uri,
        `reflection_${Date.now()}`,
        userId,
        () => {} // No progress callback needed
      );

      // Save reflection
      await saveReflection(
        userId,
        conversationId,
        prompt,
        "", // Content will be transcription
        "voice",
        voiceUrl,
        duration
      );

      onComplete();
    } catch (error) {
      console.error("Error saving voice reflection:", error);
      Alert.alert("Error", "Failed to save reflection. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceRecordingCancel = () => {
    setIsRecording(false);
  };

  const handleSaveText = async () => {
    if (!textContent.trim()) {
      Alert.alert("Empty Reflection", "Please write something before saving.");
      return;
    }

    setSaving(true);

    try {
      await saveReflection(
        userId,
        conversationId,
        prompt,
        textContent.trim(),
        "text"
      );
      onComplete();
    } catch (error) {
      console.error("Error saving text reflection:", error);
      Alert.alert("Error", "Failed to save reflection. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onSkip} style={styles.dialog}>
        <Dialog.Title style={styles.title}>Before you go...</Dialog.Title>
        <Dialog.Content>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.promptContainer}>
              <Text variant="bodyLarge" style={styles.prompt}>
                {prompt}
              </Text>
            </View>

            <SegmentedButtons
              value={inputMode}
              onValueChange={(value) => setInputMode(value as "voice" | "text")}
              buttons={[
                {
                  value: "voice",
                  label: "Voice",
                  icon: "microphone",
                },
                {
                  value: "text",
                  label: "Text",
                  icon: "text",
                },
              ]}
              style={styles.segmentedButtons}
            />

            {inputMode === "voice" ? (
              <View style={styles.voiceContainer}>
                {!isRecording ? (
                  <Button
                    mode="contained"
                    icon="microphone"
                    onPress={() => setIsRecording(true)}
                    style={styles.recordButton}
                    disabled={saving}
                  >
                    Start Recording
                  </Button>
                ) : (
                  <VoiceRecorder
                    onRecordingComplete={handleVoiceRecordingComplete}
                    onCancel={handleVoiceRecordingCancel}
                  />
                )}
              </View>
            ) : (
              <View style={styles.textContainer}>
                <TextInput
                  mode="outlined"
                  placeholder="Type your reflection..."
                  value={textContent}
                  onChangeText={setTextContent}
                  multiline
                  numberOfLines={6}
                  style={styles.textInput}
                  disabled={saving}
                />
                <Button
                  mode="contained"
                  onPress={handleSaveText}
                  style={styles.saveButton}
                  disabled={saving || !textContent.trim()}
                  loading={saving}
                >
                  Save Reflection
                </Button>
              </View>
            )}

            {saving && (
              <View style={styles.savingContainer}>
                <ActivityIndicator
                  size="small"
                  color={zenDojoTheme.colors.primary}
                />
                <Text style={styles.savingText}>Saving your reflection...</Text>
              </View>
            )}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={onSkip}
            disabled={saving || isRecording}
            textColor={zenDojoTheme.colors.primary}
          >
            Skip for now
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: zenDojoTheme.colors.surface,
    borderRadius: zenDojoTheme.borderRadius.lg,
    maxHeight: "80%",
  },
  title: {
    textAlign: "center",
    color: zenDojoTheme.colors.textPrimary,
    fontWeight: "600",
  },
  promptContainer: {
    backgroundColor: zenDojoTheme.colors.background,
    padding: zenDojoTheme.spacing.lg,
    borderRadius: zenDojoTheme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: zenDojoTheme.colors.primary,
    marginBottom: zenDojoTheme.spacing.lg,
  },
  prompt: {
    textAlign: "center",
    color: zenDojoTheme.colors.textPrimary,
    fontWeight: "500",
  },
  segmentedButtons: {
    marginBottom: zenDojoTheme.spacing.lg,
  },
  voiceContainer: {
    alignItems: "center",
    paddingVertical: zenDojoTheme.spacing.lg,
  },
  recordButton: {
    minWidth: 180,
  },
  textContainer: {
    gap: zenDojoTheme.spacing.md,
  },
  textInput: {
    backgroundColor: zenDojoTheme.colors.background,
    minHeight: 120,
  },
  saveButton: {
    marginTop: zenDojoTheme.spacing.sm,
  },
  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: zenDojoTheme.spacing.lg,
    gap: zenDojoTheme.spacing.sm,
  },
  savingText: {
    color: zenDojoTheme.colors.textSecondary,
    fontSize: 14,
  },
});
