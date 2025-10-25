// User document
export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: number;
  lastSeen: number;
  isOnline?: boolean;
  fcmToken?: string;
  // Phase 3: Matching & Connection
  availability: "online" | "offline" | "in-conversation";
  timeCommitment?: "5min" | "15min" | "30min";
  streakDays: number;
  lastConversationDate?: string; // YYYY-MM-DD format for streak tracking
  partnerCode: string; // Unique code for direct matching (e.g., "DOJO-A7B3X")
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
  // Phase 3: Conversation state management
  state?: "active" | "ended" | "archived";
  endedAt?: number;
  archivedAt?: number;
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
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  duration?: number; // for voice messages (seconds)
  isRead?: boolean;
  transcription?: string; // AI-generated transcription (Phase 2)
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

// Reflection document (Phase 2: AI Intelligence)
export interface Reflection {
  id: string;
  conversationId: string;
  createdAt: number;
  sentiment: "positive" | "neutral" | "challenging";
  themes: string[]; // Key themes identified by AI
  insights: string; // AI-generated reflection text
  userNote?: string; // Optional user note after conversation
  userFeeling?: "good" | "neutral" | "challenging"; // Emoji response
  messageCount?: number; // Number of messages analyzed
}

// Contact document (Phase 3: Matching & Connection)
export interface Contact {
  id: string; // Partner's user ID
  displayName: string;
  partnerCode: string;
  savedAt: number;
  lastConversationId?: string;
  lastConversationDate?: number;
  blocked: boolean;
  availability?: "online" | "offline" | "in-conversation";
}

// Match Request document (Phase 3: Matching & Connection)
export interface MatchRequest {
  id: string;
  userId: string;
  displayName: string;
  timeCommitment: "5min" | "15min" | "30min";
  createdAt: number;
  status: "pending" | "matched" | "expired";
  matchedWith?: string; // User ID of matched partner
  conversationId?: string; // Created conversation ID
}

// Direct Match Request (Phase 3: Matching & Connection)
export interface DirectMatchRequest {
  id: string;
  fromUserId: string;
  fromDisplayName: string;
  toUserId: string;
  toDisplayName: string;
  createdAt: number;
  status: "pending" | "accepted" | "declined" | "expired";
  conversationId?: string;
}
