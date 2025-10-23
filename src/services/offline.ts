import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueuedMessage } from "@/types";
import { OFFLINE_QUEUE_KEY } from "@/utils/constants";

/**
 * Add message to offline queue
 */
export async function addToOfflineQueue(message: QueuedMessage): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    queue.push(message);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Error adding to offline queue:", error);
  }
}

/**
 * Get all queued messages
 */
export async function getOfflineQueue(): Promise<QueuedMessage[]> {
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
