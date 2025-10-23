# Chat Dojo MVP

A personal growth messaging platform built with React Native (Expo), Firebase, and TypeScript.

## 🚀 Features

- ✅ User authentication (email/password)
- ✅ Real-time one-on-one text messaging
- ✅ Voice message recording and playback
- ✅ Message persistence (offline support)
- ✅ Online/offline presence indicators
- ✅ Message delivery and read receipts
- ✅ Optimistic UI updates
- ✅ Network resilience with offline queue
- ✅ TypeScript with strict mode
- ✅ Clean architecture with modular services

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator
- Firebase account

## 🔧 Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing one)
3. Enable the following services:

   - **Authentication**: Enable Email/Password provider
   - **Firestore Database**: Create database in production mode
   - **Storage**: Enable Firebase Storage

4. Get your Firebase configuration:

   - Go to Project Settings → General
   - Scroll down to "Your apps"
   - Click "Add app" → Web app
   - Copy the configuration object

5. Update `firebase/config.ts` with your credentials:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
   };
   ```

### 2. Deploy Firebase Security Rules

1. Install Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:

   ```bash
   firebase login
   ```

3. Initialize Firebase in the project:

   ```bash
   firebase init
   ```

   - Select Firestore and Storage
   - Use existing project
   - Accept default file names

4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   ```

### 3. Install Dependencies

```bash
cd chat-dojo
npm install
```

### 4. Run the App

Start the Expo development server:

```bash
npm start
```

Then:

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

## 🧪 Testing the MVP

### Two-Device Testing

To test real-time messaging, you need two instances:

1. **Option A: Simulator + Physical Device**

   - Run iOS Simulator on your Mac
   - Run Expo Go on your iPhone/iPad
   - Sign up with two different accounts

2. **Option B: Two Simulators**
   - Open two iOS Simulators
   - Run the app on both
   - Sign up with two different accounts

### Test Scenarios

1. ✅ **Real-time messaging**: Send text messages between devices
2. ✅ **Voice messages**: Record and play voice messages
3. ✅ **Offline mode**: Enable airplane mode, send messages, reconnect
4. ✅ **Persistence**: Force-quit app and reopen - messages should persist
5. ✅ **Message status**: Check sending → sent → delivered → read indicators

## 📁 Project Structure

```
chat-dojo/
├── App.tsx                     # Root component
├── firebase/
│   ├── config.ts              # Firebase initialization
│   ├── firestore.rules        # Firestore security rules
│   └── storage.rules          # Storage security rules
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── MessageBubble.tsx
│   │   ├── VoiceMessagePlayer.tsx
│   │   └── VoiceRecorder.tsx
│   ├── screens/               # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── ChatListScreen.tsx
│   │   ├── ConversationScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── contexts/              # React Context providers
│   │   └── AuthContext.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAudioRecording.ts
│   │   ├── useAudioPlayback.ts
│   │   └── useNetworkStatus.ts
│   ├── services/              # Service layer
│   │   ├── auth.ts           # Authentication
│   │   ├── firestore.ts      # Database operations
│   │   ├── storage.ts        # File uploads
│   │   ├── presence.ts       # Online status
│   │   └── offline.ts        # Offline queue
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   ├── constants.ts
│   │   ├── formatTime.ts
│   │   └── validation.ts
│   └── navigation/            # Navigation setup
│       └── AppNavigator.tsx
└── assets/                    # Images, fonts, etc.
```

## 🎯 Key Implementation Details

### Offline Support

- Messages are queued in AsyncStorage when offline
- Automatic sync when connection is restored
- Optimistic UI updates for instant feedback

### Voice Messages

- Recording: `expo-av` with HIGH_QUALITY preset
- Format: AAC (Advanced Audio Coding)
- Storage: Firebase Storage with progress tracking
- Playback: Custom player with progress bar

### Real-time Updates

- Firestore `onSnapshot` listeners for live data
- Message status updates (sending → sent → delivered → read)
- Online/offline presence tracking

## 🐛 Known Limitations (MVP)

- No push notifications (foreground only)
- No group chat yet (planned for post-MVP)
- Simple user selection for new chats
- No media messages (images/videos) yet
- No message editing or deletion

## 📝 Next Steps (Post-MVP)

See `tasks.md` for detailed post-MVP development tasks:

- Group chat functionality
- Contact management
- Push notifications
- Message reactions and replies
- Media sharing
- Phase 2: AI features (transcription, summarization)

## 🆘 Troubleshooting

### Firebase Connection Issues

- Check your Firebase config is correct
- Verify Firebase services are enabled
- Ensure security rules are deployed

### Audio Recording Issues

- Grant microphone permissions when prompted
- iOS Simulator has limited audio support - use physical device for best results

### Path Alias Issues

If you see import errors:

```bash
npm run start -- --clear
```

### Build Issues

Clear cache and rebuild:

```bash
rm -rf node_modules
npm install
npm run start -- --clear
```

## 📚 Documentation

- [PRD](../prd.md) - Full product requirements
- [Architecture](../architecture.mermaid) - System architecture diagrams
- [Tasks](../tasks.md) - Development task breakdown

## 📄 License

Private project for Chat Dojo MVP development.
