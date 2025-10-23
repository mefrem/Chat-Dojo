# Chat Dojo - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Firebase Setup

1. Go to https://console.firebase.google.com/
2. Click "Add project" or select existing project
3. Enable these services:

   **Authentication:**

   - Go to Authentication → Sign-in method
   - Enable "Email/Password"

   **Firestore:**

   - Go to Firestore Database → Create database
   - Start in "production mode"
   - Choose location closest to you

   **Storage:**

   - Go to Storage → Get started
   - Start in "production mode"

4. Get your config:
   - Go to Project Settings (gear icon) → General
   - Scroll to "Your apps" section
   - Click "</>" (Web) to add a web app
   - Register app with nickname "Chat Dojo"
   - Copy the `firebaseConfig` object

### Step 2: Update Firebase Config

Open `firebase/config.ts` and replace the placeholder values:

```typescript
const firebaseConfig = {
  apiKey: "AIza...", // Your API key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

### Step 3: Deploy Security Rules

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (in chat-dojo directory)
cd chat-dojo
firebase init

# Select:
# - Firestore
# - Storage
# - Use existing project (select your project)
# - Accept defaults for file paths

# Deploy rules
firebase deploy --only firestore:rules,storage:rules
```

### Step 4: Run the App

```bash
# Start Expo
npm start

# Then press:
# - 'i' for iOS Simulator (Mac only)
# - 'a' for Android Emulator
# - Scan QR with Expo Go app on phone
```

## 📱 Testing with Two Users

### Method 1: Simulator + Phone

1. Run app on iOS Simulator
2. Open Expo Go on your phone and scan QR code
3. Create two accounts with different emails
4. Start chatting!

### Method 2: Two Simulators (Mac only)

1. Open Xcode → Window → Devices and Simulators
2. Add a second simulator
3. Run app on both simulators
4. Create two accounts
5. Test real-time messaging

## ✅ Verification Checklist

After setup, verify these work:

- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Create new conversation
- [ ] Send text message
- [ ] Send voice message
- [ ] Messages appear in real-time on both devices
- [ ] Messages persist after force-quit
- [ ] Offline mode queues messages
- [ ] Sign out works

## 🐛 Common Issues

### "Firebase config not found"

- Check you've updated `firebase/config.ts` with real values
- Restart Expo dev server: `npm start -- --clear`

### "Permission denied" errors

- Deploy security rules: `firebase deploy --only firestore:rules,storage:rules`
- Check Firebase Console → Firestore → Rules tab

### "Cannot record audio"

- Grant microphone permissions when prompted
- iOS Simulator has limited audio support - use physical device
- Check app.json has microphone permissions configured

### Path alias errors

```bash
# Clear cache
npm start -- --clear

# Or full reset
rm -rf node_modules
npm install
npm start -- --clear
```

### No messages appearing

- Check Firebase Console → Firestore for data
- Verify both users are authenticated
- Check network connectivity
- Look at console logs for errors

## 📊 Firebase Console Quick Links

After setup, bookmark these:

- **Firestore Data**: Console → Firestore Database → Data
- **Auth Users**: Console → Authentication → Users
- **Storage Files**: Console → Storage → Files
- **Usage**: Console → Usage and billing

## 🎯 Next Steps

Once everything works:

1. Test all features with checklist above
2. Try offline mode (airplane mode)
3. Test force-quit and reopen
4. Review code in `/src` folders
5. Check TODOs for post-MVP features

## 💡 Tips

- **Two-device testing is essential** - many features only show with real-time sync
- **Use real devices for voice** - simulators have audio limitations
- **Check Firebase logs** - most errors visible in Firebase Console
- **Clear cache often** - use `npm start -- --clear` when things break

## 🆘 Still Stuck?

1. Check `README.md` for detailed documentation
2. Review Firebase Console for error messages
3. Check Expo dev tools console output
4. Verify all dependencies installed: `npm install`
5. Try on physical device instead of simulator

---

**Estimated setup time:** 5-10 minutes (excluding simulator downloads)

**Ready to go?** Run `npm start` and start chatting! 🎉
