// User document
export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: number;
  lastSeen: number;
  isOnline?: boolean;
  fcmToken?: string;
}

// Conversation document
export interface Conversation {
  id: string;
  participants: string[]; // array of user UIDs
  participantDetails: { [uid: string]: { displayName: string; email: string } };
  lastMessage: string;
  lastMessageTime: number;
  createdAt: number;
  type: "one-on-one" | "group";
  groupName?: string;
}

// Message document
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: "text" | "voice";
  content: string; // text content or voice file URL
  timestamp: number;
  status: "sending" | "sent" | "delivered" | "read";
  duration?: number; // for voice messages (seconds)
  isRead?: boolean;
}

// Typing indicator
export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  lastUpdate: number;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

// Message queue item for offline support
export interface QueuedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: "text" | "voice";
  content: string;
  timestamp: number;
  localUri?: string; // for voice messages stored locally
  duration?: number;
}
