import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { User } from "@/types";

/**
 * Update user's online status
 */
export async function setUserOnlineStatus(
  uid: string,
  isOnline: boolean
): Promise<void> {
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        isOnline,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating online status:", error);
  }
}

/**
 * Subscribe to user's presence
 */
export function subscribeToUserPresence(
  uid: string,
  callback: (isOnline: boolean, lastSeen: number) => void
) {
  return onSnapshot(doc(db, "users", uid), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback(data.isOnline || false, data.lastSeen?.toMillis() || Date.now());
    }
  });
}

/**
 * Set typing indicator
 */
export async function setTypingIndicator(
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  try {
    await setDoc(
      doc(db, "typing-indicators", `${conversationId}_${userId}`),
      {
        conversationId,
        userId,
        isTyping,
        lastUpdate: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error setting typing indicator:", error);
  }
}

/**
 * Subscribe to typing indicators for a conversation
 */
export function subscribeToTypingIndicators(
  conversationId: string,
  currentUserId: string,
  callback: (typingUsers: string[]) => void
) {
  // Note: In a real app, you'd query all typing indicators for this conversation
  // For simplicity, we'll just watch one document per user
  // A better approach would be to use a subcollection or query

  // For now, return an empty unsubscribe function
  // This will be enhanced when we implement the conversation screen
  return () => {};
}

/**
 * Clear typing indicator when user stops typing
 */
export async function clearTypingIndicator(
  conversationId: string,
  userId: string
): Promise<void> {
  await setTypingIndicator(conversationId, userId, false);
}
