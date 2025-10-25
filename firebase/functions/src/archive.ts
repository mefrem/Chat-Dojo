/**
 * Auto-Archive Old Conversations
 *
 * Scheduled function that runs daily to archive conversations older than 7 days.
 * Archived conversations remain accessible but don't appear in the main list.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Runs daily at midnight UTC
 */
export const archiveOldConversations = functions.pubsub
  .schedule("every day 00:00")
  .timeZone("UTC")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    try {
      console.log("Starting archive process for old conversations");

      // Find conversations older than 7 days that aren't archived
      const conversationsSnapshot = await db
        .collection("conversations")
        .where("lastMessageTime", "<", sevenDaysAgo)
        .where("archivedAt", "==", null)
        .get();

      console.log(
        `Found ${conversationsSnapshot.size} conversations to archive`
      );

      const batch = db.batch();
      let count = 0;

      conversationsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;

        // Firestore batch limit is 500 operations
        if (count >= 500) {
          console.warn(
            "Reached batch limit, some conversations may not be archived"
          );
        }
      });

      if (count > 0) {
        await batch.commit();
        console.log(`Successfully archived ${count} conversations`);
      } else {
        console.log("No conversations to archive");
      }

      return { success: true, archived: count };
    } catch (error) {
      console.error("Error archiving conversations:", error);
      return { success: false, error: (error as Error).message };
    }
  });
