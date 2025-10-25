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
  orderBy,
  where,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from "firebase/firestore";
import { Contact } from "@/types";

/**
 * Save a partner as a contact
 */
export async function saveContact(
  userId: string,
  partnerId: string,
  partnerDisplayName: string,
  partnerCode: string,
  conversationId?: string
): Promise<void> {
  const contactRef = doc(db, `users/${userId}/contacts`, partnerId);

  await setDoc(contactRef, {
    id: partnerId,
    displayName: partnerDisplayName,
    partnerCode,
    savedAt: serverTimestamp(),
    lastConversationId: conversationId || null,
    lastConversationDate: serverTimestamp(),
    blocked: false,
  });
}

/**
 * Get all contacts for a user
 */
export async function getContacts(userId: string): Promise<Contact[]> {
  const contactsRef = collection(db, `users/${userId}/contacts`);
  const q = query(contactsRef, orderBy("lastConversationDate", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.id,
      displayName: data.displayName,
      partnerCode: data.partnerCode,
      savedAt: data.savedAt?.toMillis?.() || Date.now(),
      lastConversationId: data.lastConversationId,
      lastConversationDate: data.lastConversationDate?.toMillis?.(),
      blocked: data.blocked || false,
      availability: data.availability,
    };
  });
}

/**
 * Subscribe to user's contacts with real-time updates
 */
export function subscribeToContacts(
  userId: string,
  callback: (contacts: Contact[]) => void
): Unsubscribe {
  const contactsRef = collection(db, `users/${userId}/contacts`);
  const q = query(contactsRef, orderBy("lastConversationDate", "desc"));

  return onSnapshot(q, (snapshot) => {
    const contacts: Contact[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: data.id,
          displayName: data.displayName,
          partnerCode: data.partnerCode,
          savedAt: data.savedAt?.toMillis?.() || Date.now(),
          lastConversationId: data.lastConversationId,
          lastConversationDate: data.lastConversationDate?.toMillis?.(),
          blocked: data.blocked || false,
          availability: data.availability,
        };
      })
      // Filter out blocked contacts in memory
      .filter((contact) => !contact.blocked);

    callback(contacts);
  });
}

/**
 * Check if a contact exists
 */
export async function isContact(
  userId: string,
  partnerId: string
): Promise<boolean> {
  const contactRef = doc(db, `users/${userId}/contacts`, partnerId);
  const contactDoc = await getDoc(contactRef);
  return contactDoc.exists();
}

/**
 * Update contact's last conversation info
 */
export async function updateContactLastConversation(
  userId: string,
  partnerId: string,
  conversationId: string
): Promise<void> {
  const contactRef = doc(db, `users/${userId}/contacts`, partnerId);
  await updateDoc(contactRef, {
    lastConversationId: conversationId,
    lastConversationDate: serverTimestamp(),
  });
}

/**
 * Block a contact
 */
export async function blockContact(
  userId: string,
  partnerId: string
): Promise<void> {
  const contactRef = doc(db, `users/${userId}/contacts`, partnerId);
  await updateDoc(contactRef, {
    blocked: true,
  });
}

/**
 * Unblock a contact
 */
export async function unblockContact(
  userId: string,
  partnerId: string
): Promise<void> {
  const contactRef = doc(db, `users/${userId}/contacts`, partnerId);
  await updateDoc(contactRef, {
    blocked: false,
  });
}

/**
 * Delete a contact
 */
export async function deleteContact(
  userId: string,
  partnerId: string
): Promise<void> {
  const contactRef = doc(db, `users/${userId}/contacts`, partnerId);
  await deleteDoc(contactRef);
}

/**
 * Get blocked contact IDs for a user
 */
export async function getBlockedContactIds(userId: string): Promise<string[]> {
  const contactsRef = collection(db, `users/${userId}/contacts`);
  const q = query(contactsRef, where("blocked", "==", true));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.id);
}
