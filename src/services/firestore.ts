import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { User, Conversation, Message } from "@/types";

/**
 * Create or update user document
 */
export async function createUserDocument(
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  try {
    await setDoc(doc(db, "users", uid), {
      uid,
      email,
      displayName,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isOnline: true,
    });
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
}

/**
 * Get user document
 */
export async function getUserDocument(uid: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        lastSeen: data.lastSeen?.toMillis() || Date.now(),
        isOnline: data.isOnline || false,
        fcmToken: data.fcmToken,
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting user document:", error);
    throw error;
  }
}

/**
 * Get all users (for creating conversations)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    return usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        lastSeen: data.lastSeen?.toMillis() || Date.now(),
        isOnline: data.isOnline || false,
        fcmToken: data.fcmToken,
      };
    });
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  participantUids: string[],
  type: "one-on-one" | "group" = "one-on-one",
  groupName?: string
): Promise<string> {
  try {
    // Check if conversation already exists for one-on-one chats
    if (type === "one-on-one" && participantUids.length === 2) {
      const existingConv = await findExistingConversation(participantUids);
      if (existingConv) {
        return existingConv;
      }
    }

    // Fetch participant details
    const participantDetails: {
      [uid: string]: { displayName: string; email: string };
    } = {};
    for (const uid of participantUids) {
      const user = await getUserDocument(uid);
      if (user) {
        participantDetails[uid] = {
          displayName: user.displayName,
          email: user.email,
        };
      }
    }

    const conversationData: any = {
      participants: participantUids,
      participantDetails,
      lastMessage: "",
      lastMessageTime: serverTimestamp(),
      createdAt: serverTimestamp(),
      type,
    };

    if (groupName) {
      conversationData.groupName = groupName;
    }

    const conversationRef = await addDoc(
      collection(db, "conversations"),
      conversationData
    );
    return conversationRef.id;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
}

/**
 * Find existing conversation between participants
 */
async function findExistingConversation(
  participantUids: string[]
): Promise<string | null> {
  try {
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", participantUids[0])
    );
    const snapshot = await getDocs(q);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (
        data.participants.length === participantUids.length &&
        participantUids.every((uid: string) => data.participants.includes(uid))
      ) {
        return doc.id;
      }
    }
    return null;
  } catch (error) {
    console.error("Error finding existing conversation:", error);
    return null;
  }
}

/**
 * Get conversations for a user with real-time updates
 */
export function subscribeToConversations(
  userUid: string,
  callback: (conversations: Conversation[]) => void
) {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userUid),
    orderBy("lastMessageTime", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        participants: data.participants,
        participantDetails: data.participantDetails || {},
        lastMessage: data.lastMessage || "",
        lastMessageTime: data.lastMessageTime?.toMillis() || Date.now(),
        createdAt: data.createdAt?.toMillis() || Date.now(),
        type: data.type || "one-on-one",
        groupName: data.groupName,
      };
    });
    callback(conversations);
  });
}

/**
 * Send a text message
 */
export async function sendTextMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  content: string
): Promise<string> {
  try {
    const messageData = {
      conversationId,
      senderId,
      senderName,
      type: "text",
      content,
      timestamp: serverTimestamp(),
      status: "sent",
      isRead: false,
    };

    const messageRef = await addDoc(collection(db, "messages"), messageData);

    // Update conversation's last message
    await updateDoc(doc(db, "conversations", conversationId), {
      lastMessage: content.substring(0, 100),
      lastMessageTime: serverTimestamp(),
    });

    return messageRef.id;
  } catch (error) {
    console.error("Error sending text message:", error);
    throw error;
  }
}

/**
 * Send a voice message
 */
export async function sendVoiceMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  voiceUrl: string,
  duration: number
): Promise<string> {
  try {
    const messageData = {
      conversationId,
      senderId,
      senderName,
      type: "voice",
      content: voiceUrl,
      duration,
      timestamp: serverTimestamp(),
      status: "sent",
      isRead: false,
    };

    const messageRef = await addDoc(collection(db, "messages"), messageData);

    // Update conversation's last message
    await updateDoc(doc(db, "conversations", conversationId), {
      lastMessage: "🎤 Voice message",
      lastMessageTime: serverTimestamp(),
    });

    return messageRef.id;
  } catch (error) {
    console.error("Error sending voice message:", error);
    throw error;
  }
}

/**
 * Subscribe to messages in a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
) {
  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderName: data.senderName,
        type: data.type,
        content: data.content,
        timestamp: data.timestamp?.toMillis() || Date.now(),
        status: data.status || "sent",
        duration: data.duration,
        isRead: data.isRead || false,
      };
    });
    callback(messages);
  });
}

/**
 * Update message status
 */
export async function updateMessageStatus(
  messageId: string,
  status: "sending" | "sent" | "delivered" | "read"
): Promise<void> {
  try {
    await updateDoc(doc(db, "messages", messageId), {
      status,
      ...(status === "read" && { isRead: true }),
    });
  } catch (error) {
    console.error("Error updating message status:", error);
    throw error;
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userUid: string
): Promise<void> {
  try {
    // Simplified query without != operator to avoid complex indexing
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      where("isRead", "==", false)
    );

    const snapshot = await getDocs(q);

    // Filter out messages sent by current user in JavaScript
    const messagesToUpdate = snapshot.docs.filter(
      (doc) => doc.data().senderId !== userUid
    );

    const updatePromises = messagesToUpdate.map((doc) =>
      updateDoc(doc.ref, {
        status: "read",
        isRead: true,
      })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error marking messages as read:", error);
    // Don't throw error as this is non-critical
  }
}
