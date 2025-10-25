import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

/**
 * Get all push tokens for a user
 */
async function getUserPushTokens(userId: string): Promise<string[]> {
  try {
    const tokensSnapshot = await admin
      .firestore()
      .collection(`users/${userId}/pushTokens`)
      .get();

    const tokens: string[] = [];
    tokensSnapshot.forEach((doc) => {
      const token = doc.data().token;
      if (Expo.isExpoPushToken(token)) {
        tokens.push(token);
      }
    });

    return tokens;
  } catch (error) {
    console.error(`Error fetching push tokens for user ${userId}:`, error);
    return [];
  }
}

/**
 * Send push notifications
 */
async function sendPushNotifications(
  messages: ExpoPushMessage[]
): Promise<void> {
  try {
    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }
  } catch (error) {
    console.error("Error sending push notifications:", error);
  }
}

/**
 * Scheduled function: Check for inactive conversations and send reminders
 * Runs once daily at 10:00 AM UTC (configurable)
 */
export const sendConversationReminders = functions.pubsub
  .schedule("0 10 * * *") // Runs at 10:00 AM UTC daily
  .timeZone("UTC")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    try {
      console.log("Starting conversation reminder check...");

      // Get all active conversations
      const conversationsSnapshot = await db
        .collection("conversations")
        .where("state", "==", "active")
        .get();

      let remindersProcessed = 0;
      let remindersSent = 0;

      for (const conversationDoc of conversationsSnapshot.docs) {
        const conversation = conversationDoc.data();
        const conversationId = conversationDoc.id;
        const lastMessageTime = conversation.lastMessageTime;

        // Skip if no messages yet or conversation is too recent
        if (!lastMessageTime) {
          continue;
        }

        // Check if last message was more than 24 hours ago
        if (lastMessageTime < twentyFourHoursAgo) {
          remindersProcessed++;

          // Get the last message to determine who should be reminded
          const lastMessageSnapshot = await db
            .collection("messages")
            .where("conversationId", "==", conversationId)
            .orderBy("timestamp", "desc")
            .limit(1)
            .get();

          if (lastMessageSnapshot.empty) {
            continue;
          }

          const lastMessage = lastMessageSnapshot.docs[0].data();
          const lastSenderId = lastMessage.senderId;

          // Find the participant who should be reminded (not the last sender)
          const participantToRemind = conversation.participants.find(
            (id: string) => id !== lastSenderId
          );

          if (!participantToRemind) {
            continue;
          }

          // Get the partner's name (the person who sent the last message)
          const partnerName =
            conversation.participantDetails[lastSenderId]?.displayName ||
            "Someone";

          // Get push tokens for the user to remind
          const tokens = await getUserPushTokens(participantToRemind);

          if (tokens.length === 0) {
            console.log(`No push tokens found for user ${participantToRemind}`);
            continue;
          }

          // Create notification messages
          const notifications: ExpoPushMessage[] = tokens.map((token) => ({
            to: token,
            sound: "default",
            title: "Don't forget to reply! 💬",
            body: `${partnerName} is waiting for your response`,
            data: {
              conversationId: conversationId,
              type: "conversation_reminder",
            },
            channelId: "reminders",
          }));

          // Send notifications
          await sendPushNotifications(notifications);
          remindersSent += notifications.length;

          console.log(
            `Sent ${notifications.length} reminder(s) for conversation ${conversationId}`
          );

          // Optional: Update conversation with reminder timestamp
          await db.collection("conversations").doc(conversationId).update({
            lastReminderSent: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      console.log(
        `Reminder check complete: Processed ${remindersProcessed} conversations, sent ${remindersSent} notifications`
      );

      return {
        success: true,
        conversationsProcessed: remindersProcessed,
        remindersSent: remindersSent,
      };
    } catch (error) {
      console.error("Error in sendConversationReminders:", error);
      return { success: false, error: (error as Error).message };
    }
  });

/**
 * Callable function: Manually trigger conversation reminder for a specific user
 * (useful for testing)
 */
export const sendManualReminder = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;
    const conversationId = data.conversationId;

    if (!conversationId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "conversationId is required"
      );
    }

    try {
      const tokens = await getUserPushTokens(userId);

      if (tokens.length === 0) {
        return { success: false, message: "No push tokens found" };
      }

      const notifications: ExpoPushMessage[] = tokens.map((token) => ({
        to: token,
        sound: "default",
        title: "Conversation Reminder 💬",
        body: "You have an unfinished conversation waiting for you!",
        data: {
          conversationId: conversationId,
          type: "conversation_reminder",
        },
        channelId: "reminders",
      }));

      await sendPushNotifications(notifications);

      return { success: true, notificationsSent: notifications.length };
    } catch (error) {
      console.error("Error sending manual reminder:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to send reminder"
      );
    }
  }
);
