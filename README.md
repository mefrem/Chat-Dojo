# Chat Dojo

A voice-first messaging app for meaningful conversations with AI-powered insights. Built with React Native (Expo), Firebase, and OpenAI.

## 🚀 Quick Setup (5 minutes)

### Prerequisites

- Node.js 18+
- iOS Simulator (Mac) or Android Emulator
- Firebase account (free tier works)

### 1. Install Dependencies

```bash
cd chat-dojo
npm install
```

### 2. Firebase Setup

1. **Create Firebase Project**: https://console.firebase.google.com/
2. **Enable Services**:
   - Authentication → Email/Password
   - Firestore Database → Production mode
   - Storage → Production mode
3. **Get Config**: Project Settings → General → Add Web App → Copy config
4. **Update `.env` file** in chat-dojo root:

```bash
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Deploy Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase init  # Select Firestore + Storage, choose your project
firebase deploy --only firestore:rules,storage:rules
```

### 4. Run the App

```bash
# For iOS simulator (recommended)
npx expo run:ios

# Or use Expo Go (no AI features)
npx expo start
# Then press 'i' for iOS or scan QR code
```

## 🧪 Testing (Requires 2 Devices)

**Option A**: iOS Simulator + Physical iPhone
**Option B**: Two iOS Simulators (File → Open Simulator → Choose different model)

1. Create two accounts with different emails
2. Find Partner to get matched
3. Send text and voice messages
4. View AI Insights (chart icon) after sending voice messages

## ✨ Features

- 🎤 Voice & text messaging
- 🤖 AI transcription & conversation insights
- 🔥 Conversation streaks
- 📱 Partner matching system
- 🔌 Works offline with automatic sync
- 📊 Real-time sentiment analysis

## 🐛 Troubleshooting

**Permission Errors**: Deploy security rules (Step 3)

**"Can't find module"**: Clear cache with `npx expo start -c`

**Metro Bundler Issues**:

```bash
rm -rf ~/.expo/native-modules-cache
npx expo start -c
```

**Audio not working**: Grant microphone permissions, use physical device (simulators have limited audio)

**AI features not working**: See `firebase/functions/README.md` to deploy Cloud Functions with OpenAI API key

## 📁 Project Structure

```
chat-dojo/
├── src/
│   ├── screens/      # HomeScreen, ConversationScreen, etc.
│   ├── components/   # MessageBubble, VoiceRecorder, VoicePlayer
│   ├── services/     # Firebase, matching, offline queue
│   ├── hooks/        # Audio recording/playback, network status
│   └── contexts/     # Auth context
├── firebase/
│   ├── config.ts           # Firebase client config
│   ├── firestore.rules     # Security rules
│   └── functions/          # Cloud Functions (AI)
└── .env                    # Firebase credentials (create this!)
```

## 🔒 Important Notes

- **Create `.env` file** with your Firebase credentials (Step 2)
- **Deploy security rules** or you'll get permission errors (Step 3)
- **Use `npx expo run:ios`** for full features (not `npx expo start`)
- AI features require deploying Cloud Functions (optional)

## 📞 Need Help?

Check the Firebase Console for real-time errors:

- **Firestore**: Console → Firestore Database → Data
- **Auth**: Console → Authentication → Users
- **Logs**: Console → Functions → Logs (if using AI features)

---

**Ready? Run `npx expo run:ios` and start chatting!** 🎉
