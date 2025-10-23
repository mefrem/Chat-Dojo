// App constants
export const APP_NAME = "Chat Dojo";

// Message status
export const MESSAGE_STATUS = {
  SENDING: "sending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
} as const;

// Message types
export const MESSAGE_TYPE = {
  TEXT: "text",
  VOICE: "voice",
} as const;

// Conversation types
export const CONVERSATION_TYPE = {
  ONE_ON_ONE: "one-on-one",
  GROUP: "group",
} as const;

// Typing indicator timeout (3 seconds)
export const TYPING_INDICATOR_TIMEOUT = 3000;

// Offline queue storage key
export const OFFLINE_QUEUE_KEY = "@chat_dojo_offline_queue";

// Max retry attempts for failed uploads
export const MAX_RETRY_ATTEMPTS = 3;

// Exponential backoff base delay (ms)
export const BACKOFF_BASE_DELAY = 1000;
