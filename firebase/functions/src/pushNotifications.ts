import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

// Create a new Expo SDK client
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
 * Send push notifications to multiple tokens
 */
async function sendPushNotifications(
  messages: ExpoPushMessage[]
): Promise<void> {
  try {
    // Split messages into chunks (Expo has a limit of 100 per request)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    // Send all chunks
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }

    // Log any errors
    tickets.forEach((ticket, index) => {
      if (ticket.status === "error") {
        console.error(
          `Error with notification ${index}:`,
          ticket.message,
          ticket.details
        );
      }
    });
  } catch (error) {
    console.error("Error sending push notifications:", error);
  }
}

/**
 * Trigger: New message created
 * Send notification to the recipient(s)
 */
export const onNewMessage = functions.firestore
  .document("messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const { messageId } = context.params;

    try {
      // Get the conversation to find participants
      const conversationDoc = await admin
        .firestore()
        .collection("conversations")
        .doc(message.conversationId)
        .get();

      if (!conversationDoc.exists) {
        console.log("Conversation not found");
        return null;
      }

      const conversation = conversationDoc.data()!;
      const senderId = message.senderId;
      const senderName = message.senderName || "Someone";

      // Get recipient user IDs (everyone except the sender)
      const recipientIds = conversation.participants.filter(
        (id: string) => id !== senderId
      );

      // Prepare notifications for each recipient
      const notifications: ExpoPushMessage[] = [];

      for (const recipientId of recipientIds) {
        const tokens = await getUserPushTokens(recipientId);

        // Determine notification body based on message type
        let body = "";
        if (message.type === "text") {
          body = message.content;
        } else if (message.type === "voice") {
          body = "🎤 Sent a voice message";
        }

        for (const token of tokens) {
          notifications.push({
            to: token,
            sound: "default",
            title: senderName,
            body: body,
            data: {
              conversationId: message.conversationId,
              messageId: messageId,
              type: "new_message",
            },
            channelId: "messages",
          });
        }
      }

      if (notifications.length > 0) {
        await sendPushNotifications(notifications);
        console.log(
          `Sent ${notifications.length} notifications for message ${messageId}`
        );
      }

      return { success: true, notificationsSent: notifications.length };
    } catch (error) {
      console.error(
        `Error sending notification for message ${messageId}:`,
        error
      );
      return { success: false, error: (error as Error).message };
    }
  });

/**
 * Trigger: Match request status updated to "matched"
 * Send notification to both users
 */
export const onMatchFound = functions.firestore
  .document("matchingQueue/{requestId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger if status changed to "matched"
    if (before.status !== "matched" && after.status === "matched") {
      try {
        const userId = after.userId;
        const tokens = await getUserPushTokens(userId);

        const notifications: ExpoPushMessage[] = tokens.map((token) => ({
          to: token,
          sound: "default",
          title: "Match Found! 🎉",
          body: "You've been matched with a conversation partner!",
          data: {
            conversationId: after.conversationId,
            type: "match_found",
          },
          channelId: "messages",
        }));

        if (notifications.length > 0) {
          await sendPushNotifications(notifications);
          console.log(
            `Sent ${notifications.length} match notifications to user ${userId}`
          );
        }

        return { success: true, notificationsSent: notifications.length };
      } catch (error) {
        console.error("Error sending match notification:", error);
        return { success: false, error: (error as Error).message };
      }
    }

    return null;
  });

/**
 * Trigger: User availability status changes to "online"
 * Notify contacts/recent conversation partners
 */
export const onUserOnline = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { userId } = context.params;

    // Only trigger if availability changed to "online" from "offline"
    if (before.availability !== "online" && after.availability === "online") {
      try {
        const displayName = after.displayName || "A contact";

        // Get user's contacts
        const contactsSnapshot = await admin
          .firestore()
          .collection(`users/${userId}/contacts`)
          .where("blocked", "==", false)
          .limit(10)
          .get();

        const notifications: ExpoPushMessage[] = [];

        for (const contactDoc of contactsSnapshot.docs) {
          const contact = contactDoc.data();
          const contactUserId = contact.userId;

          const tokens = await getUserPushTokens(contactUserId);

          for (const token of tokens) {
            notifications.push({
              to: token,
              sound: "default",
              title: `${displayName} is now online`,
              body: "Start a conversation!",
              data: {
                userId: userId,
                type: "user_online",
              },
              channelId: "messages",
            });
          }
        }

        if (notifications.length > 0) {
          await sendPushNotifications(notifications);
          console.log(
            `Sent ${notifications.length} online notifications for user ${userId}`
          );
        }

        return { success: true, notificationsSent: notifications.length };
      } catch (error) {
        console.error("Error sending online notification:", error);
        return { success: false, error: (error as Error).message };
      }
    }

    return null;
  });

/**
 * Callable function: Send a test notification
 */
export const sendTestNotification = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;
    const tokens = await getUserPushTokens(userId);

    if (tokens.length === 0) {
      return { success: false, message: "No push tokens found" };
    }

    const notifications: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      sound: "default",
      title: "Test Notification",
      body: "This is a test notification from Chat Dojo!",
      data: { type: "test" },
    }));

    await sendPushNotifications(notifications);

    return { success: true, notificationsSent: notifications.length };
  }
);
