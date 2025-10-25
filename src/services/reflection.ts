import { db } from "../../firebase/config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Unsubscribe,
  where,
  limit,
} from "firebase/firestore";
import { Reflection } from "@/types";

/**
 * Subscribe to user's reflections feed
 */
export function subscribeToReflections(
  userId: string,
  callback: (reflections: Reflection[]) => void
): Unsubscribe {
  const reflectionsRef = collection(db, `users/${userId}/reflections`);
  const q = query(reflectionsRef, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const reflections: Reflection[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        conversationId: data.conversationId,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        sentiment: data.sentiment || "neutral",
        themes: data.themes || [],
        insights: data.insights || "",
        userNote: data.userNote,
        userFeeling: data.userFeeling,
        messageCount: data.messageCount,
      };
    });

    callback(reflections);
  });
}

/**
 * Get reflections filtered by sentiment
 */
export function subscribeToReflectionsBySentiment(
  userId: string,
  sentiment: "positive" | "neutral" | "challenging",
  callback: (reflections: Reflection[]) => void
): Unsubscribe {
  const reflectionsRef = collection(db, `users/${userId}/reflections`);
  const q = query(
    reflectionsRef,
    where("sentiment", "==", sentiment),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const reflections: Reflection[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        conversationId: data.conversationId,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        sentiment: data.sentiment || "neutral",
        themes: data.themes || [],
        insights: data.insights || "",
        userNote: data.userNote,
        userFeeling: data.userFeeling,
        messageCount: data.messageCount,
      };
    });

    callback(reflections);
  });
}

/**
 * Add user note and feeling to a reflection
 */
export async function updateReflectionResponse(
  userId: string,
  reflectionId: string,
  userFeeling: "good" | "neutral" | "challenging",
  userNote?: string
): Promise<void> {
  const reflectionRef = doc(db, `users/${userId}/reflections/${reflectionId}`);
  await updateDoc(reflectionRef, {
    userFeeling,
    userNote: userNote || null,
  });
}

/**
 * Get reflection by conversation ID
 */
export function subscribeToReflectionByConversation(
  userId: string,
  conversationId: string,
  callback: (reflection: Reflection | null) => void
): Unsubscribe {
  const reflectionsRef = collection(db, `users/${userId}/reflections`);
  const q = query(
    reflectionsRef,
    where("conversationId", "==", conversationId),
    limit(1) // Only one reflection per conversation
  );

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const reflection: Reflection = {
      id: doc.id,
      conversationId: data.conversationId,
      createdAt: data.createdAt?.toMillis?.() || Date.now(),
      sentiment: data.sentiment || "neutral",
      themes: data.themes || [],
      insights: data.insights || "",
      userNote: data.userNote,
      userFeeling: data.userFeeling,
      messageCount: data.messageCount,
    };

    callback(reflection);
  });
}
