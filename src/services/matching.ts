import { db } from "../../firebase/config";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from "firebase/firestore";
import { MatchRequest, DirectMatchRequest } from "@/types";
import { createConversation } from "./firestore";
import { getBlockedContactIds } from "./contacts";

/**
 * Request a random match with available partners
 */
export async function requestRandomMatch(
  userId: string,
  displayName: string
): Promise<{
  matched: boolean;
  matchRequestId?: string;
  conversationId?: string;
}> {
  const matchRequestId = `${userId}_${Date.now()}`;
  const matchRequestRef = doc(db, "matchingQueue", matchRequestId);

  try {
    // Get blocked contact IDs
    const blockedIds = await getBlockedContactIds(userId);

    // Look for available partners
    const matchingQueueRef = collection(db, "matchingQueue");
    const q = query(
      matchingQueueRef,
      where("status", "==", "pending"),
      limit(10) // Get a few to filter out blocked users
    );

    const snapshot = await getDocs(q);
    let potentialMatch = null;

    // Find first non-blocked, non-self partner
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (
        data.userId !== userId &&
        !blockedIds.includes(data.userId) &&
        data.status === "pending"
      ) {
        potentialMatch = { id: doc.id, ...data };
        break;
      }
    }

    if (potentialMatch) {
      // Match found! Create conversation outside of transaction first
      const conversationId = await createConversation([
        userId,
        potentialMatch.userId,
      ]);

      // Clean up match requests
      try {
        await deleteDoc(doc(db, "matchingQueue", potentialMatch.id));
      } catch (e) {
        console.log("Partner match request already deleted");
      }

      try {
        await deleteDoc(matchRequestRef);
      } catch (e) {
        console.log("Current user match request already deleted");
      }

      return { matched: true, conversationId };
    } else {
      // No match found, create persistent pending request
      await setDoc(matchRequestRef, {
        id: matchRequestId,
        userId,
        displayName,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      return { matched: false, matchRequestId };
    }
  } catch (error) {
    console.error("Error requesting match:", error);
    throw error;
  }
}

/**
 * Cancel a pending match request
 */
export async function cancelMatchRequest(
  matchRequestId: string
): Promise<void> {
  const matchRequestRef = doc(db, "matchingQueue", matchRequestId);
  await deleteDoc(matchRequestRef);
}

/**
 * Subscribe to a match request for real-time updates
 */
export function subscribeToMatchRequest(
  matchRequestId: string,
  callback: (matchRequest: MatchRequest | null) => void
): Unsubscribe {
  const matchRequestRef = doc(db, "matchingQueue", matchRequestId);

  return onSnapshot(matchRequestRef, (doc) => {
    if (!doc.exists()) {
      callback(null);
      return;
    }

    const data = doc.data();
    callback({
      id: doc.id,
      userId: data.userId,
      displayName: data.displayName,
      timeCommitment: data.timeCommitment,
      createdAt: data.createdAt?.toMillis?.() || Date.now(),
      status: data.status,
      matchedWith: data.matchedWith,
      conversationId: data.conversationId,
    });
  });
}

/**
 * Request a direct match with a specific partner by their partner code
 */
export async function requestDirectMatch(
  fromUserId: string,
  fromDisplayName: string,
  toUserId: string,
  toDisplayName: string
): Promise<string> {
  const requestId = `${fromUserId}_${toUserId}_${Date.now()}`;
  const requestRef = doc(db, "directMatchRequests", requestId);

  await setDoc(requestRef, {
    id: requestId,
    fromUserId,
    fromDisplayName,
    toUserId,
    toDisplayName,
    createdAt: serverTimestamp(),
    status: "pending",
  });

  return requestId;
}

/**
 * Accept a direct match request
 */
export async function acceptDirectMatch(requestId: string): Promise<string> {
  const requestRef = doc(db, "directMatchRequests", requestId);

  return await runTransaction(db, async (transaction) => {
    const requestDoc = await transaction.get(requestRef);

    if (!requestDoc.exists()) {
      throw new Error("Match request not found");
    }

    const requestData = requestDoc.data();

    if (requestData.status !== "pending") {
      throw new Error("Match request already processed");
    }

    // Create conversation
    const conversationRef = doc(collection(db, "conversations"));
    const conversationId = conversationRef.id;

    const participantDetails = {
      [requestData.fromUserId]: {
        displayName: requestData.fromDisplayName,
        email: "",
      },
      [requestData.toUserId]: {
        displayName: requestData.toDisplayName,
        email: "",
      },
    };

    transaction.set(conversationRef, {
      id: conversationId,
      participants: [requestData.fromUserId, requestData.toUserId],
      participantDetails,
      lastMessage: "",
      lastMessageTime: Date.now(),
      createdAt: Date.now(),
      type: "one-on-one",
      state: "active",
    });

    // Update request status
    transaction.update(requestRef, {
      status: "accepted",
      conversationId,
    });

    // Delete request (cleanup)
    transaction.delete(requestRef);

    return conversationId;
  });
}

/**
 * Decline a direct match request
 */
export async function declineDirectMatch(requestId: string): Promise<void> {
  const requestRef = doc(db, "directMatchRequests", requestId);

  await updateDoc(requestRef, {
    status: "declined",
  });

  // Delete after marking as declined
  await deleteDoc(requestRef);
}

/**
 * Subscribe to incoming direct match requests for a user
 */
export function subscribeToIncomingMatchRequests(
  userId: string,
  callback: (requests: DirectMatchRequest[]) => void
): Unsubscribe {
  const requestsRef = collection(db, "directMatchRequests");
  const q = query(
    requestsRef,
    where("toUserId", "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(q, (snapshot) => {
    const requests: DirectMatchRequest[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        fromUserId: data.fromUserId,
        fromDisplayName: data.fromDisplayName,
        toUserId: data.toUserId,
        toDisplayName: data.toDisplayName,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        status: data.status,
        conversationId: data.conversationId,
      };
    });

    callback(requests);
  });
}

/**
 * Clean up expired match requests (older than 5 minutes)
 */
export async function cleanupExpiredMatchRequests(): Promise<void> {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const matchingQueueRef = collection(db, "matchingQueue");
  const q = query(
    matchingQueueRef,
    where("status", "==", "pending"),
    where("createdAt", "<", fiveMinutesAgo)
  );

  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}
