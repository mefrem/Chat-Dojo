import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Transcribe voice reflections using OpenAI Whisper
 * Triggered when a new voice reflection is created
 */
export const transcribeReflectionVoice = functions.firestore
  .document("personalReflections/{reflectionId}")
  .onCreate(async (snap, context) => {
    const reflection = snap.data();

    // Only process voice reflections
    if (reflection.type !== "voice" || !reflection.voiceUrl) {
      return;
    }

    try {
      console.log(
        `Transcribing voice reflection ${context.params.reflectionId}`
      );

      // Download the audio file
      const response = await fetch(reflection.voiceUrl);
      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: "audio/m4a" });

      // Create a File object for OpenAI
      const audioFile = new File([audioBlob], "reflection.m4a", {
        type: "audio/m4a",
      });

      // Transcribe using OpenAI Whisper
      const transcription = await getOpenAIClient().audio.transcriptions.create(
        {
          file: audioFile,
          model: "whisper-1",
          language: "en",
        }
      );

      // Update the reflection with transcription
      await snap.ref.update({
        transcription: transcription.text,
        content: transcription.text, // Also set as content for easier searching
      });

      console.log(
        `Successfully transcribed reflection ${context.params.reflectionId}`
      );
    } catch (error) {
      console.error("Error transcribing reflection:", error);
      // Don't throw - allow the reflection to exist without transcription
    }
  });

/**
 * Analyze personal reflections to identify themes and patterns
 * Can be triggered manually or scheduled
 */
export const analyzePersonalReflections = functions.https.onCall(
  async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;

    try {
      console.log(`Analyzing reflections for user ${userId}`);

      // Get reflections from last 30 days
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const reflectionsSnapshot = await admin
        .firestore()
        .collection("personalReflections")
        .where("userId", "==", userId)
        .where("createdAt", ">=", thirtyDaysAgo)
        .orderBy("createdAt", "desc")
        .get();

      // Need at least 3 reflections
      if (reflectionsSnapshot.size < 3) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Need at least 3 reflections for analysis"
        );
      }

      // Prepare reflection data for AI analysis
      const reflections = reflectionsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          prompt: data.prompt,
          content:
            data.type === "voice"
              ? data.transcription || "[Voice - not transcribed]"
              : data.content,
          date: new Date(data.createdAt).toLocaleDateString(),
        };
      });

      // Prepare prompt for OpenAI
      const systemPrompt = `You are analyzing personal reflections from someone practicing embodied truth-telling and self-awareness. 
      
Your task:
1. Identify 3-5 recurring themes across all reflections
2. Determine overall emotional tone (one phrase, e.g. "courageously exploring", "gently opening", "wrestling with resistance")
3. Provide 2-3 key insights about patterns you notice

Return ONLY valid JSON in this exact format:
{
  "topThemes": [{"theme": "theme name", "count": estimated_frequency}],
  "emotionalTone": "brief phrase",
  "insights": "2-3 sentences about patterns and growth"
}`;

      const userPrompt = `Analyze these ${
        reflections.length
      } reflections:\n\n${reflections
        .map(
          (r, i) =>
            `${i + 1}. ${r.date}\nPrompt: "${r.prompt}"\nReflection: ${
              r.content
            }\n`
        )
        .join("\n")}`;

      // Call OpenAI
      const completion = await getOpenAIClient().chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseText = completion.choices[0].message.content || "{}";
      const analysis = JSON.parse(responseText);

      // Save analysis to Firestore
      const analysisData = {
        userId,
        analyzedAt: Date.now(),
        totalReflections: reflections.length,
        dateRange: {
          start: thirtyDaysAgo,
          end: Date.now(),
        },
        topThemes: analysis.topThemes || [],
        insights: analysis.insights || "",
        emotionalTone: analysis.emotionalTone || "exploring",
      };

      await admin
        .firestore()
        .collection("reflectionAnalysis")
        .add(analysisData);

      console.log(`Successfully analyzed reflections for user ${userId}`);

      return {
        success: true,
        reflectionsAnalyzed: reflections.length,
        themes: analysis.topThemes.length,
      };
    } catch (error) {
      console.error("Error analyzing reflections:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to analyze reflections"
      );
    }
  }
);

/**
 * Scheduled function to analyze reflections for active users
 * Runs daily at 3 AM
 */
export const scheduledReflectionAnalysis = functions.pubsub
  .schedule("0 3 * * *")
  .timeZone("America/Los_Angeles")
  .onRun(async (context) => {
    console.log("Running scheduled reflection analysis");

    try {
      // Find users who have reflections in the last 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      // Get users with recent reflections
      const recentReflections = await admin
        .firestore()
        .collection("personalReflections")
        .where("createdAt", ">=", sevenDaysAgo)
        .get();

      // Group by userId
      const userReflectionCounts = new Map<string, number>();
      recentReflections.docs.forEach((doc) => {
        const userId = doc.data().userId;
        userReflectionCounts.set(
          userId,
          (userReflectionCounts.get(userId) || 0) + 1
        );
      });

      // Analyze for users with 3+ reflections
      const analysisPromises: Promise<any>[] = [];
      userReflectionCounts.forEach((count, userId) => {
        if (count >= 3) {
          // Check if they already have a recent analysis (within 7 days)
          const checkAndAnalyze = async () => {
            const recentAnalysis = await admin
              .firestore()
              .collection("reflectionAnalysis")
              .where("userId", "==", userId)
              .where("analyzedAt", ">=", sevenDaysAgo)
              .limit(1)
              .get();

            // Only analyze if no recent analysis exists
            if (recentAnalysis.empty) {
              console.log(`Analyzing reflections for user ${userId}`);
              // Call the analysis function internally
              return analyzePersonalReflections.run({}, {
                auth: { uid: userId },
              } as any);
            }
          };

          analysisPromises.push(checkAndAnalyze());
        }
      });

      await Promise.allSettled(analysisPromises);

      console.log(
        `Scheduled analysis complete. Processed ${analysisPromises.length} users.`
      );
    } catch (error) {
      console.error("Error in scheduled reflection analysis:", error);
    }
  });
