# Push Notifications Guide 📱

Quick reference for testing and debugging push notifications in Chat Dojo.

---

## 🚀 Quick Start

### **1. Running on Physical Device (Required)**

Push notifications **only work on physical devices**, not simulators.

```bash
# Build and run on connected iOS device
npx expo run:ios --device

# Or for Android
npx expo run:android --device
```

---

## 🧪 Testing Notifications

### **Method 1: Natural Flow (Recommended)**

1. **Login on Device A**
2. **Login on Device B** (different user)
3. **Send message from Device A**
4. **Device B receives notification** ✅

### **Method 2: Manual Test Notification**

Use the `sendTestNotification` Cloud Function:

```bash
# Via Firebase Console
1. Go to Firebase Console → Functions
2. Click "sendTestNotification"
3. Click "Test function"
4. Should receive test notification on your device
```

### **Method 3: Manual Reminder**

Trigger a conversation reminder:

```bash
# Via Firebase Console
1. Go to Firebase Console → Functions
2. Click "sendManualReminder"
3. Provide data: { "conversationId": "your-conversation-id" }
4. Should receive reminder notification
```

---

## 🔍 Debugging

### **Check if Token is Registered:**

1. **View Logs:**

   ```bash
   # Look for "Push token registered successfully" in console
   npx expo start
   ```

2. **Check Firestore:**
   - Go to Firestore Database
   - Navigate to `users/{userId}/pushTokens`
   - Should see your device token

### **Check Cloud Function Logs:**

```bash
# View all function logs
firebase functions:log

# View logs for specific function
firebase functions:log --only onNewMessage
```

### **Common Issues:**

| Issue                                              | Solution                                                     |
| -------------------------------------------------- | ------------------------------------------------------------ |
| "Push notifications only work on physical devices" | Use `npx expo run:ios --device` instead of simulator         |
| Token not showing in Firestore                     | Check if user granted notification permissions               |
| Notifications not received                         | Verify token exists in Firestore and Cloud Function deployed |
| "No push tokens found" in logs                     | User needs to login to register token                        |

---

## 📋 Notification Types

### **1. New Message** 💬

- **Trigger:** When someone sends you a message
- **Title:** Sender's name
- **Body:** Message content (or "🎤 Sent a voice message")
- **Data:** `conversationId`, `messageId`
- **Channel:** `messages` (Android)

### **2. Match Found** 🎉

- **Trigger:** When you're matched with a partner
- **Title:** "Match Found! 🎉"
- **Body:** "You've been matched with a conversation partner!"
- **Data:** `conversationId`
- **Channel:** `messages` (Android)

### **3. Partner Online** 🟢

- **Trigger:** When a contact comes online
- **Title:** "[Partner Name] is now online"
- **Body:** "Start a conversation!"
- **Data:** `userId`
- **Channel:** `messages` (Android)

### **4. Conversation Reminder** ⏰

- **Trigger:** Daily at 10 AM UTC for inactive conversations (24h+)
- **Title:** "Don't forget to reply! 💬"
- **Body:** "[Partner Name] is waiting for your response"
- **Data:** `conversationId`
- **Channel:** `reminders` (Android)

---

## ⚙️ Configuration

### **Notification Channels (Android)**

Defined in `src/services/pushNotifications.ts`:

```typescript
// High priority for messages
"messages" - importance: HIGH, sound: default, vibration: [0, 250, 250, 250]

// Normal priority for reminders
"reminders" - importance: DEFAULT, vibration: [0, 250]
```

### **Notification Permissions (iOS)**

Defined in `app.json`:

```json
{
  "notification": {
    "icon": "./assets/icon.png",
    "color": "#6200ee"
  }
}
```

### **Reminder Schedule**

Defined in `firebase/functions/src/reminders.ts`:

```typescript
// Runs daily at 10:00 AM UTC
.schedule("0 10 * * *")
```

To change schedule:

1. Edit cron expression in `reminders.ts`
2. Run `npm run build` in functions directory
3. Deploy: `firebase deploy --only functions:sendConversationReminders`

---

## 📊 Monitoring

### **Check Notification Delivery:**

1. **Firebase Console:**

   - Go to Functions → Logs
   - Filter by function name (e.g., `onNewMessage`)
   - Look for "Sent X notifications"

2. **Client Logs:**
   - Check console for "Notification received:" or "Notification tapped:"

### **Track Engagement:**

Monitor these metrics:

- Push token registration success rate
- Notification delivery rate (check Cloud Function logs)
- Notification open rate (when user taps)
- Reminder response rate (user replies after reminder)

---

## 🛠️ Advanced Usage

### **Programmatic Token Management:**

```typescript
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
} from "@/services/pushNotifications";

// Register token
const token = await registerForPushNotifications();
if (token) {
  await savePushToken(userId, token);
}

// Remove token (e.g., on logout)
await removePushToken(userId, token);
```

### **Custom Notification Handling:**

```typescript
import { setupNotificationListeners } from "@/services/pushNotifications";

// Set up listeners
const cleanup = setupNotificationListeners(
  (notification) => {
    // Handle notification received while app is open
    console.log("Received:", notification);
  },
  (response) => {
    // Handle notification tapped
    const { conversationId } = response.notification.request.content.data;
    navigation.navigate("Conversation", { conversationId });
  }
);

// Cleanup when component unmounts
return () => cleanup();
```

---

## 📱 Testing Checklist

Before releasing to production:

- [ ] Test on physical iOS device
- [ ] Test on physical Android device (if applicable)
- [ ] Verify new message notifications work
- [ ] Verify match found notifications work
- [ ] Verify partner online notifications work (optional)
- [ ] Test tapping notifications navigates correctly
- [ ] Test notifications when app is:
  - [ ] In foreground
  - [ ] In background
  - [ ] Completely closed
- [ ] Test manual reminder function
- [ ] Verify tokens are saved/removed on login/logout
- [ ] Check Firestore security rules allow token access

---

## 🎯 Next Steps

1. **Test on device** - Connect physical device and run app
2. **Monitor logs** - Check for successful token registration
3. **Send test messages** - Verify notifications appear
4. **Adjust settings** - Tune notification frequency/content based on feedback

---

## 💡 Tips

- **iOS Push Certificates:** Expo handles this automatically for managed workflow
- **Testing with Expo Go:** Push notifications work in Expo Go, but you'll need a development build for production
- **Notification Sound:** Uses system default; can be customized with custom sound files
- **Badge Count:** Automatically managed by the system based on unread notifications

---

## 🆘 Support

If notifications aren't working:

1. Check device permissions: Settings → Chat Dojo → Notifications → Allow
2. Verify token in Firestore: `users/{userId}/pushTokens`
3. Check Cloud Function logs: `firebase functions:log`
4. Ensure functions are deployed: `firebase deploy --only functions`
5. Verify device is not in Do Not Disturb mode

---

**Happy Testing!** 🚀
