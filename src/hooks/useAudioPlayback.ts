import { useState, useEffect } from "react";
import { Audio } from "expo-av";

export function useAudioPlayback() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    return () => {
      // Cleanup
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadAudio = async (uri: string) => {
    try {
      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      return newSound;
    } catch (error) {
      console.error("Error loading audio:", error);
      throw error;
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis / 1000);
      setDuration(status.durationMillis / 1000);

      // Reset when finished
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const playAudio = async () => {
    if (!sound) return;

    try {
      await sound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const pauseAudio = async () => {
    if (!sound) return;

    try {
      await sound.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  };

  const seekAudio = async (positionSeconds: number) => {
    if (!sound) return;

    try {
      await sound.setPositionAsync(positionSeconds * 1000);
    } catch (error) {
      console.error("Error seeking audio:", error);
    }
  };

  const stopAudio = async () => {
    if (!sound) return;

    try {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      setIsPlaying(false);
      setPosition(0);
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  };

  return {
    isPlaying,
    position,
    duration,
    loadAudio,
    playAudio,
    pauseAudio,
    seekAudio,
    stopAudio,
  };
}
