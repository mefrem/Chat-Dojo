import { db } from "../../firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { User } from "@/types";

/**
 * Generate a unique partner code (e.g., "DOJO-A7B3X")
 */
function generatePartnerCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluding ambiguous chars
  let code = "DOJO-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Migrate existing user to Phase 3 schema
 * Adds missing fields for users created before Phase 3
 */
export async function migrateUserToPhase3(userId: string): Promise<void> {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error("User not found");
  }

  const userData = userDoc.data();

  // Check if migration is needed
  if (userData.partnerCode && userData.availability !== undefined) {
    // User already migrated
    return;
  }

  // Generate partner code if missing
  const partnerCode = userData.partnerCode || generatePartnerCode();

  // Update user document with Phase 3 fields
  await updateDoc(userRef, {
    availability: userData.availability || "offline",
    streakDays: userData.streakDays || 0,
    partnerCode,
  });

  console.log(`Migrated user ${userId} to Phase 3 schema`);
}

/**
 * Get user by partner code
 */
export async function getUserByPartnerCode(
  partnerCode: string
): Promise<User | null> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("partnerCode", "==", partnerCode));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  const data = userDoc.data();

  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
    lastSeen: data.lastSeen?.toMillis?.() || Date.now(),
    isOnline: data.isOnline,
    availability: data.availability || "offline",
    timeCommitment: data.timeCommitment,
    streakDays: data.streakDays || 0,
    lastConversationDate: data.lastConversationDate,
    partnerCode: data.partnerCode,
  };
}

/**
 * Update user availability
 */
export async function updateUserAvailability(
  userId: string,
  availability: "online" | "offline" | "in-conversation"
): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    availability,
    lastSeen: serverTimestamp(),
  });
}

/**
 * Update user time commitment preference
 */
export async function updateTimeCommitment(
  userId: string,
  timeCommitment: "5min" | "15min" | "30min"
): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    timeCommitment,
  });
}

/**
 * Update user streak
 */
export async function updateUserStreak(
  userId: string,
  streakDays: number,
  lastConversationDate: string
): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    streakDays,
    lastConversationDate,
  });
}

/**
 * Get user document
 */
export async function getUserDoc(userId: string): Promise<User | null> {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
    lastSeen: data.lastSeen?.toMillis?.() || Date.now(),
    isOnline: data.isOnline,
    availability: data.availability || "offline",
    timeCommitment: data.timeCommitment,
    streakDays: data.streakDays || 0,
    lastConversationDate: data.lastConversationDate,
    partnerCode: data.partnerCode,
  };
}
