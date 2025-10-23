import { useState } from "react";
import { Audio } from "expo-av";
import { Platform } from "react-native";

export function useAudioRecording() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error requesting audio permissions:", error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      // Clean up any existing recording first
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.log("Cleaned up stale recording");
        }
        setRecording(null);
        setRecordingDuration(0);
      }

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error("Audio recording permission not granted");
      }

      // Configure audio mode for iOS
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);

      // Update duration while recording
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setRecordingDuration(status.durationMillis / 1000);
        }
      });

      return newRecording;
    } catch (error: any) {
      // Handle "already prepared" error gracefully
      if (error?.message?.includes("already prepared")) {
        console.log("Recorder already prepared, retrying...");
        // Reset state and try once more
        setRecording(null);
        setIsRecording(false);
        setRecordingDuration(0);
        
        // Reset audio mode and retry
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
          });
          // Small delay to ensure cleanup
          await new Promise((resolve) => setTimeout(resolve, 100));
          // Retry once
          return startRecording();
        } catch (retryError) {
          console.error("Retry failed:", retryError);
          throw retryError;
        }
      }
      
      console.error("Failed to start recording:", error);
      throw error;
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      return null;
    }

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const duration = status.durationMillis / 1000;

      setRecording(null);
      setRecordingDuration(0);

      return { uri, duration };
    } catch (error) {
      console.error("Failed to stop recording:", error);
      throw error;
    }
  };

  const cancelRecording = async () => {
    if (!recording) {
      return;
    }

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error("Failed to cancel recording:", error);
    }
  };

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
