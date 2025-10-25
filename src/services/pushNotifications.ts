import { Platform } from "react-native";
import { db } from "../../firebase/config";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

// Conditionally import expo-notifications (native module)
let Notifications: any = null;
let Device: any = null;

try {
  Notifications = require("expo-notifications");
  Device = require("expo-device");

  // Configure how notifications are presented when the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.log(
    "Push notifications not available - native module not found. This is normal in simulators."
  );
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications || !Device) {
    console.log("Push notifications module not available");
    return false;
  }

  if (!Device.isDevice) {
    console.log("Push notifications only work on physical devices");
    return false;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push notification permissions");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
}

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications || !Device) {
    console.log("Push notifications module not available");
    return null;
  }

  if (!Device.isDevice) {
    console.log("Push notifications only work on physical devices");
    return null;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get the Expo push token
    // Note: projectId is automatically read from app.json in Expo 50+
    const tokenData = await Notifications.getExpoPushTokenAsync();

    const token = tokenData.data;
    console.log("Expo push token:", token);

    // Configure notification channel for Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6200ee",
      });

      await Notifications.setNotificationChannelAsync("messages", {
        name: "Messages",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6200ee",
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: "#6200ee",
      });
    }

    return token;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

/**
 * Save the push token to Firestore for the user
 */
export async function savePushToken(
  userId: string,
  token: string
): Promise<void> {
  try {
    const tokenRef = doc(db, `users/${userId}/pushTokens`, token);
    await setDoc(tokenRef, {
      token,
      platform: Platform.OS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log("Push token saved to Firestore");
  } catch (error) {
    console.error("Error saving push token:", error);
    throw error;
  }
}

/**
 * Remove a push token from Firestore (e.g., on logout)
 */
export async function removePushToken(
  userId: string,
  token: string
): Promise<void> {
  try {
    const tokenRef = doc(db, `users/${userId}/pushTokens`, token);
    await deleteDoc(tokenRef);
    console.log("Push token removed from Firestore");
  } catch (error) {
    console.error("Error removing push token:", error);
    throw error;
  }
}

/**
 * Set up notification listeners for when the app receives notifications
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationResponse?: (response: any) => void
) {
  if (!Notifications) {
    console.log("Push notifications module not available");
    return () => {}; // Return no-op cleanup function
  }

  // Listener for notifications received while the app is in the foreground
  const receivedListener = Notifications.addNotificationReceivedListener(
    (notification: any) => {
      console.log("Notification received:", notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Listener for when a user taps on a notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log("Notification tapped:", response);
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(receivedListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Clear all delivered notifications (e.g., when user opens the app)
 */
export async function clearAllNotifications(): Promise<void> {
  if (!Notifications) return;

  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error("Error clearing notifications:", error);
  }
}

/**
 * Get the notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  if (!Notifications) return 0;

  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error("Error getting badge count:", error);
    return 0;
  }
}

/**
 * Set the notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (!Notifications) return;

  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error("Error setting badge count:", error);
  }
}
