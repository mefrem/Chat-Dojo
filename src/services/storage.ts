import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTask,
} from "firebase/storage";
import { storage } from "../../firebase/config";

/**
 * Upload voice message to Firebase Storage
 */
export async function uploadVoiceMessage(
  uri: string,
  conversationId: string,
  senderId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Fetch the file from local URI
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `voice_${senderId}_${timestamp}.m4a`;
    const storageRef = ref(
      storage,
      `voice-messages/${conversationId}/${filename}`
    );

    // Upload the file
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Error
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          // Success - get download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error uploading voice message:", error);
    throw error;
  }
}

/**
 * Cancel an ongoing upload
 */
export function cancelUpload(uploadTask: UploadTask): void {
  uploadTask.cancel();
}
