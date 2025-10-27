import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { PersonalReflection, ReflectionThemeAnalysis } from "@/types";

/**
 * Save a personal reflection to Firestore
 */
export async function saveReflection(
  userId: string,
  conversationId: string,
  prompt: string,
  content: string,
  type: "voice" | "text",
  voiceUrl?: string,
  duration?: number
): Promise<string> {
  const reflectionData = {
    userId,
    conversationId,
    prompt,
    content,
    type,
    voiceUrl: voiceUrl || null,
    duration: duration || null,
    transcription: null,
    createdAt: Date.now(),
  };

  const docRef = await addDoc(
    collection(db, "personalReflections"),
    reflectionData
  );

  return docRef.id;
}

/**
 * Get user's reflections, sorted by date (newest first)
 */
export async function getUserReflections(
  userId: string,
  limitCount: number = 50
): Promise<PersonalReflection[]> {
  const q = query(
    collection(db, "personalReflections"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PersonalReflection[];
}

/**
 * Get reflections for a specific conversation
 */
export async function getReflectionsByConversation(
  userId: string,
  conversationId: string
): Promise<PersonalReflection[]> {
  const q = query(
    collection(db, "personalReflections"),
    where("userId", "==", userId),
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PersonalReflection[];
}

/**
 * Subscribe to reflections for a specific conversation
 */
export function subscribeToConversationReflections(
  userId: string,
  conversationId: string,
  callback: (reflections: PersonalReflection[]) => void
): () => void {
  const q = query(
    collection(db, "personalReflections"),
    where("userId", "==", userId),
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "desc"),
    limit(3)
  );

  return onSnapshot(q, (snapshot) => {
    const reflections = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PersonalReflection[];
    callback(reflections);
  });
}

/**
 * Subscribe to user's latest reflection theme analysis
 */
export function subscribeToReflectionAnalysis(
  userId: string,
  callback: (analysis: ReflectionThemeAnalysis | null) => void
): () => void {
  const q = query(
    collection(db, "reflectionAnalysis"),
    where("userId", "==", userId),
    orderBy("analyzedAt", "desc"),
    limit(1)
  );

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }

    const analysis = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as ReflectionThemeAnalysis;

    callback(analysis);
  });
}
