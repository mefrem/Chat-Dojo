import AsyncStorage from "@react-native-async-storage/async-storage";

const PLAYBACK_POSITION_PREFIX = "playback_position_";

export interface PlaybackPosition {
  messageId: string;
  position: number; // in milliseconds
  duration: number; // total duration in milliseconds
  timestamp: number; // when position was saved
}

/**
 * Save playback position for a voice message
 */
export async function savePlaybackPosition(
  messageId: string,
  position: number,
  duration: number
): Promise<void> {
  try {
    // Only save if there's meaningful progress (>1 second and not at the end)
    if (position < 1000 || position >= duration - 1000) {
      await clearPlaybackPosition(messageId);
      return;
    }

    const playbackData: PlaybackPosition = {
      messageId,
      position,
      duration,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(
      `${PLAYBACK_POSITION_PREFIX}${messageId}`,
      JSON.stringify(playbackData)
    );
  } catch (error) {
    console.error("Error saving playback position:", error);
  }
}

/**
 * Get saved playback position for a voice message
 */
export async function getPlaybackPosition(
  messageId: string
): Promise<PlaybackPosition | null> {
  try {
    const dataJson = await AsyncStorage.getItem(
      `${PLAYBACK_POSITION_PREFIX}${messageId}`
    );

    if (!dataJson) {
      return null;
    }

    const data: PlaybackPosition = JSON.parse(dataJson);

    // Discard positions older than 7 days
    const ageDays = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
    if (ageDays > 7) {
      await clearPlaybackPosition(messageId);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting playback position:", error);
    return null;
  }
}

/**
 * Clear playback position for a voice message
 */
export async function clearPlaybackPosition(messageId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${PLAYBACK_POSITION_PREFIX}${messageId}`);
  } catch (error) {
    console.error("Error clearing playback position:", error);
  }
}

/**
 * Clear all old playback positions (cleanup utility)
 */
export async function clearOldPlaybackPositions(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const playbackKeys = keys.filter((key) =>
      key.startsWith(PLAYBACK_POSITION_PREFIX)
    );

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    for (const key of playbackKeys) {
      const dataJson = await AsyncStorage.getItem(key);
      if (dataJson) {
        const data: PlaybackPosition = JSON.parse(dataJson);
        if (now - data.timestamp > sevenDaysMs) {
          await AsyncStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error("Error clearing old playback positions:", error);
  }
}
