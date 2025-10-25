import AsyncStorage from "@react-native-async-storage/async-storage";

const SCROLL_POSITION_PREFIX = "scroll_position_";

export interface ScrollPosition {
  conversationId: string;
  offset: number; // scroll offset in pixels
  messageId?: string; // optional message ID at that position
  timestamp: number; // when position was saved
}

/**
 * Save scroll position for a conversation
 */
export async function saveScrollPosition(
  conversationId: string,
  offset: number,
  messageId?: string
): Promise<void> {
  try {
    const scrollData: ScrollPosition = {
      conversationId,
      offset,
      messageId,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(
      `${SCROLL_POSITION_PREFIX}${conversationId}`,
      JSON.stringify(scrollData)
    );
  } catch (error) {
    console.error("Error saving scroll position:", error);
  }
}

/**
 * Get saved scroll position for a conversation
 */
export async function getScrollPosition(
  conversationId: string
): Promise<ScrollPosition | null> {
  try {
    const dataJson = await AsyncStorage.getItem(
      `${SCROLL_POSITION_PREFIX}${conversationId}`
    );

    if (!dataJson) {
      return null;
    }

    const data: ScrollPosition = JSON.parse(dataJson);

    // Discard positions older than 24 hours
    const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
    if (ageHours > 24) {
      await clearScrollPosition(conversationId);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting scroll position:", error);
    return null;
  }
}

/**
 * Clear scroll position for a conversation
 */
export async function clearScrollPosition(
  conversationId: string
): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${SCROLL_POSITION_PREFIX}${conversationId}`);
  } catch (error) {
    console.error("Error clearing scroll position:", error);
  }
}

/**
 * Clear all old scroll positions (cleanup utility)
 */
export async function clearOldScrollPositions(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const scrollKeys = keys.filter((key) =>
      key.startsWith(SCROLL_POSITION_PREFIX)
    );

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (const key of scrollKeys) {
      const dataJson = await AsyncStorage.getItem(key);
      if (dataJson) {
        const data: ScrollPosition = JSON.parse(dataJson);
        if (now - data.timestamp > oneDayMs) {
          await AsyncStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error("Error clearing old scroll positions:", error);
  }
}
