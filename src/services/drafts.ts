import AsyncStorage from "@react-native-async-storage/async-storage";

const DRAFT_MESSAGE_PREFIX = "draft_message_";
const DRAFT_RECORDING_PREFIX = "draft_recording_";

export interface DraftMessage {
  conversationId: string;
  content: string;
  timestamp: number;
}

export interface DraftRecording {
  conversationId: string;
  uri: string;
  duration: number;
  timestamp: number;
}

/**
 * Save draft text message for a conversation
 */
export async function saveDraftMessage(
  conversationId: string,
  content: string
): Promise<void> {
  try {
    const draft: DraftMessage = {
      conversationId,
      content,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(
      `${DRAFT_MESSAGE_PREFIX}${conversationId}`,
      JSON.stringify(draft)
    );
  } catch (error) {
    console.error("Error saving draft message:", error);
  }
}

/**
 * Get draft text message for a conversation
 */
export async function getDraftMessage(
  conversationId: string
): Promise<DraftMessage | null> {
  try {
    const draftJson = await AsyncStorage.getItem(
      `${DRAFT_MESSAGE_PREFIX}${conversationId}`
    );
    if (!draftJson) {
      return null;
    }
    const draft: DraftMessage = JSON.parse(draftJson);

    // Discard drafts older than 24 hours
    const ageHours = (Date.now() - draft.timestamp) / (1000 * 60 * 60);
    if (ageHours > 24) {
      await clearDraftMessage(conversationId);
      return null;
    }

    return draft;
  } catch (error) {
    console.error("Error getting draft message:", error);
    return null;
  }
}

/**
 * Clear draft text message for a conversation
 */
export async function clearDraftMessage(conversationId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${DRAFT_MESSAGE_PREFIX}${conversationId}`);
  } catch (error) {
    console.error("Error clearing draft message:", error);
  }
}

/**
 * Save draft recording for a conversation
 */
export async function saveDraftRecording(
  conversationId: string,
  uri: string,
  duration: number
): Promise<void> {
  try {
    const draft: DraftRecording = {
      conversationId,
      uri,
      duration,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(
      `${DRAFT_RECORDING_PREFIX}${conversationId}`,
      JSON.stringify(draft)
    );
  } catch (error) {
    console.error("Error saving draft recording:", error);
  }
}

/**
 * Get draft recording for a conversation
 */
export async function getDraftRecording(
  conversationId: string
): Promise<DraftRecording | null> {
  try {
    const draftJson = await AsyncStorage.getItem(
      `${DRAFT_RECORDING_PREFIX}${conversationId}`
    );
    if (!draftJson) {
      return null;
    }
    const draft: DraftRecording = JSON.parse(draftJson);

    // Discard recordings older than 1 hour
    const ageMinutes = (Date.now() - draft.timestamp) / (1000 * 60);
    if (ageMinutes > 60) {
      await clearDraftRecording(conversationId);
      return null;
    }

    return draft;
  } catch (error) {
    console.error("Error getting draft recording:", error);
    return null;
  }
}

/**
 * Clear draft recording for a conversation
 */
export async function clearDraftRecording(
  conversationId: string
): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${DRAFT_RECORDING_PREFIX}${conversationId}`);
  } catch (error) {
    console.error("Error clearing draft recording:", error);
  }
}

/**
 * Clear all drafts (text and recording) for a conversation
 */
export async function clearAllDrafts(conversationId: string): Promise<void> {
  await Promise.all([
    clearDraftMessage(conversationId),
    clearDraftRecording(conversationId),
  ]);
}
