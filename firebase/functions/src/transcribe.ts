/**
 * Voice Message Transcription Function
 *
 * Triggers when a new voice message is created in Firestore.
 * Downloads the audio file from Firebase Storage and transcribes it using OpenAI Whisper.
 * Updates the message document with the transcription.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import * as https from "https";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

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

/**
 * Triggers on new voice message creation
 */
export const transcribeVoiceMessage = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"],
  })
  .firestore.document("messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const { messageId } = context.params;

    // Only process voice messages
    if (message.type !== "voice") {
      console.log(`Message ${messageId} is not a voice message, skipping`);
      return null;
    }

    // Check if already transcribed
    if (message.transcription) {
      console.log(`Message ${messageId} already has transcription, skipping`);
      return null;
    }

    try {
      console.log(`Starting transcription for message ${messageId}`);

      // Download audio file from Firebase Storage URL
      const audioUrl = message.content;
      const tempFilePath = path.join(os.tmpdir(), `${messageId}.m4a`);

      await downloadFile(audioUrl, tempFilePath);
      console.log(`Downloaded audio file to ${tempFilePath}`);

      // Transcribe using OpenAI Whisper
      const transcription = await transcribeAudio(tempFilePath);
      console.log(
        `Transcription complete: ${transcription.substring(0, 50)}...`
      );

      // Update message document with transcription
      await admin.firestore().collection("messages").doc(messageId).update({
        transcription: transcription,
        transcribedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      console.log(`Successfully transcribed message ${messageId}`);
      return { success: true, messageId };
    } catch (error) {
      console.error(`Error transcribing message ${messageId}:`, error);

      // Log error but don't fail - transcription is not critical
      await admin
        .firestore()
        .collection("messages")
        .doc(messageId)
        .update({
          transcriptionError: (error as Error).message,
          transcriptionAttemptedAt:
            admin.firestore.FieldValue.serverTimestamp(),
        });

      return { success: false, error: (error as Error).message };
    }
  });

/**
 * Download file from URL to local path
 */
async function downloadFile(url: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (error) => {
        fs.unlink(filePath, () => {});
        reject(error);
      });
  });
}

/**
 * Transcribe audio file using OpenAI Whisper
 */
async function transcribeAudio(filePath: string): Promise<string> {
  const audioFile = fs.createReadStream(filePath);
  const client = getOpenAIClient();

  const response = await client.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "en", // Can be removed to auto-detect
    response_format: "text",
  });

  return response as unknown as string;
}
