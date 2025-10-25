/**
 * Chat Dojo Cloud Functions
 *
 * Functions for AI-powered features:
 * - Voice message transcription (Whisper)
 * - Conversation reflection generation (GPT-4)
 * - Auto-archive old conversations
 * - Push notifications (Phase 4)
 * - Conversation reminders (Phase 4)
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Export individual functions
export { transcribeVoiceMessage } from "./transcribe";
export { generateReflection, generateReflectionManual } from "./reflection";
export { archiveOldConversations } from "./archive";

// Phase 4: Push Notifications & Reminders
export {
  onNewMessage,
  onMatchFound,
  onUserOnline,
  sendTestNotification,
} from "./pushNotifications";
export { sendConversationReminders, sendManualReminder } from "./reminders";

// Health check function
export const healthCheck = functions.https.onRequest((request, response) => {
  response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "chat-dojo-functions",
  });
});
