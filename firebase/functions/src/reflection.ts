/**
 * AI Reflection Generation Function
 *
 * Triggers when a conversation has been idle for 10+ minutes.
 * Analyzes the conversation using GPT-4 and generates personal reflections
 * for each participant.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";

// Lazy initialization of OpenAI client (only when function runs)
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

interface Message {
  senderName: string;
  senderId: string;
  type: "text" | "voice";
  content: string;
  transcription?: string;
  timestamp: number;
}

interface ConversationAnalysis {
  sentiment: "positive" | "neutral" | "challenging";
  themes: string[];
  insights: string;
}

/**
 * Scheduled function to check for conversations ready for reflection
 * Runs every 5 minutes
 */
export const generateReflection = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"],
  })
  .pubsub.schedule("every 5 minutes")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;

    try {
      // Find conversations with recent activity but no reflection
      const conversationsSnapshot = await db
        .collection("conversations")
        .where("lastMessageTime", "<", tenMinutesAgo)
        .where("lastMessageTime", ">", now - 60 * 60 * 1000) // Within last hour
        .get();

      console.log(
        `Found ${conversationsSnapshot.size} conversations to process`
      );

      const promises = conversationsSnapshot.docs.map(
        async (conversationDoc) => {
          const conversationId = conversationDoc.id;
          const conversationData = conversationDoc.data();

          // Check if reflection already generated for this conversation
          const existingReflections = await db
            .collectionGroup("reflections")
            .where("conversationId", "==", conversationId)
            .limit(1)
            .get();

          if (!existingReflections.empty) {
            console.log(
              `Reflection already exists for conversation ${conversationId}`
            );
            return;
          }

          // Generate reflection
          await generateReflectionForConversation(
            conversationId,
            conversationData.participants
          );
        }
      );

      await Promise.all(promises);
      console.log("Reflection generation complete");
    } catch (error) {
      console.error("Error in reflection generation:", error);
    }

    return null;
  });

/**
 * Generate reflection for a specific conversation
 */
async function generateReflectionForConversation(
  conversationId: string,
  participants: string[]
): Promise<void> {
  const db = admin.firestore();

  try {
    console.log(`Generating reflection for conversation ${conversationId}`);

    // Fetch all messages from the conversation
    const messagesSnapshot = await db
      .collection("messages")
      .where("conversationId", "==", conversationId)
      .orderBy("timestamp", "asc")
      .get();

    const messages: Message[] = messagesSnapshot.docs.map(
      (doc) => doc.data() as Message
    );

    if (messages.length === 0) {
      console.log("No messages to analyze");
      return;
    }

    // Analyze conversation for each participant
    for (const participantId of participants) {
      const analysis = await analyzeConversationForUser(
        messages,
        participantId
      );

      // Create reflection document
      await db
        .collection("users")
        .doc(participantId)
        .collection("reflections")
        .add({
          conversationId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          sentiment: analysis.sentiment,
          themes: analysis.themes,
          insights: analysis.insights,
          messageCount: messages.length,
        });

      console.log(`Created reflection for user ${participantId}`);
    }
  } catch (error) {
    console.error(`Error generating reflection for ${conversationId}:`, error);
    throw error;
  }
}

/**
 * Analyze conversation using GPT-4 and generate personalized insights
 */
async function analyzeConversationForUser(
  messages: Message[],
  userId: string
): Promise<ConversationAnalysis> {
  // Build conversation transcript
  const transcript = messages
    .map((msg) => {
      const text =
        msg.type === "voice" && msg.transcription
          ? msg.transcription
          : msg.content;
      const isUser = msg.senderId === userId;
      const speaker = isUser ? "You" : msg.senderName;
      return `${speaker}: ${text}`;
    })
    .join("\n\n");

  // Generate analysis using GPT-4
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a thoughtful reflection coach analyzing a personal growth conversation. 
Your role is to identify key themes, emotional patterns, and provide supportive insights.
Focus on what the user expressed, patterns in their thinking, and moments of growth or challenge.
Be warm, non-judgmental, and insightful. Keep your analysis concise (2-3 paragraphs).`,
      },
      {
        role: "user",
        content: `Analyze this conversation and provide:
1. Overall sentiment (positive, neutral, or challenging)
2. 3-5 key themes discussed
3. Personal insights for growth and reflection

Conversation:
${transcript}

Format your response as JSON:
{
  "sentiment": "positive|neutral|challenging",
  "themes": ["theme1", "theme2", ...],
  "insights": "Your 2-3 paragraph reflection here"
}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const responseText = completion.choices[0].message.content || "{}";

  try {
    const analysis = JSON.parse(responseText) as ConversationAnalysis;
    return analysis;
  } catch (error) {
    console.error("Error parsing GPT-4 response:", error);
    // Return a fallback analysis
    return {
      sentiment: "neutral",
      themes: ["conversation", "connection"],
      insights:
        "Thank you for sharing in this conversation. Reflection helps us grow.",
    };
  }
}

/**
 * Manual trigger for generating a reflection for a specific conversation
 * (useful for testing)
 */
export const generateReflectionManual = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"],
  })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const conversationId = data.conversationId;

    if (!conversationId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "conversationId is required"
      );
    }

    const db = admin.firestore();

    try {
      // Get conversation
      const conversationDoc = await db
        .collection("conversations")
        .doc(conversationId)
        .get();

      if (!conversationDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Conversation not found"
        );
      }

      const conversation = conversationDoc.data()!;

      // Generate reflection
      await generateReflectionForConversation(
        conversationId,
        conversation.participants
      );

      return { success: true, message: "Reflection generated successfully" };
    } catch (error) {
      console.error("Error in generateReflectionManual:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to generate reflection: ${(error as Error).message}`
      );
    }
  });
