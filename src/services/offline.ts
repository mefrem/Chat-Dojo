import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueuedMessage } from "@/types";
import { OFFLINE_QUEUE_KEY } from "@/utils/constants";

// Extended queued message with retry metadata
export interface QueuedMessageWithRetry extends QueuedMessage {
  retryCount?: number;
  lastRetryTime?: number;
  status?: "pending" | "uploading" | "failed";
}

/**
 * Add message to offline queue with retry tracking
 */
export async function addToOfflineQueue(message: QueuedMessage): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const messageWithRetry: QueuedMessageWithRetry = {
      ...message,
      retryCount: 0,
      lastRetryTime: Date.now(),
      status: "pending",
    };
    queue.push(messageWithRetry);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Error adding to offline queue:", error);
  }
}

/**
 * Get all queued messages
 */
export async function getOfflineQueue(): Promise<QueuedMessageWithRetry[]> {
  try {
    const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error("Error getting offline queue:", error);
    return [];
  }
}

/**
 * Remove message from offline queue
 */
export async function removeFromOfflineQueue(messageId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const updatedQueue = queue.filter((msg) => msg.id !== messageId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error("Error removing from offline queue:", error);
  }
}

/**
 * Clear entire offline queue
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error("Error clearing offline queue:", error);
  }
}

/**
 * Update message status in queue
 */
export async function updateMessageStatus(
  messageId: string,
  status: "pending" | "uploading" | "failed"
): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const updatedQueue = queue.map((msg) => {
      if (msg.id === messageId) {
        return { ...msg, status };
      }
      return msg;
    });
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error("Error updating message status:", error);
  }
}

/**
 * Increment retry count for a message
 */
export async function incrementRetryCount(messageId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const updatedQueue = queue.map((msg) => {
      if (msg.id === messageId) {
        const retryCount = (msg.retryCount || 0) + 1;
        return {
          ...msg,
          retryCount,
          lastRetryTime: Date.now(),
        };
      }
      return msg;
    });
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error("Error incrementing retry count:", error);
  }
}

/**
 * Calculate retry delay with exponential backoff
 * Max 5 retries: 1s, 2s, 4s, 8s, 16s
 */
export function getRetryDelay(retryCount: number): number {
  const baseDelay = 1000; // 1 second
  const maxRetries = 5;
  if (retryCount >= maxRetries) {
    return -1; // No more retries
  }
  return baseDelay * Math.pow(2, retryCount);
}

/**
 * Check if message should be retried based on time and retry count
 */
export function shouldRetryMessage(msg: QueuedMessageWithRetry): boolean {
  const retryCount = msg.retryCount || 0;
  const lastRetryTime = msg.lastRetryTime || 0;
  const now = Date.now();
  const retryDelay = getRetryDelay(retryCount);

  if (retryDelay === -1) {
    return false; // Max retries reached
  }

  return now - lastRetryTime >= retryDelay;
}

/**
 * Get messages ready for retry
 */
export async function getMessagesReadyForRetry(): Promise<
  QueuedMessageWithRetry[]
> {
  try {
    const queue = await getOfflineQueue();
    return queue.filter((msg) => shouldRetryMessage(msg));
  } catch (error) {
    console.error("Error getting messages ready for retry:", error);
    return [];
  }
}
