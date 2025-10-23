# 🚀 Chat Dojo - Quick Start

## ⚡ 3 Steps to Run

### Step 1: Firebase Setup (2 minutes)

1. Go to https://console.firebase.google.com/
2. Create project → Enable Authentication (Email/Password) + Firestore + Storage
3. Copy your config from Project Settings → General → Web App
4. Paste into `firebase/config.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

### Step 2: Deploy Security Rules (1 minute)

```bash
npm install -g firebase-tools
firebase login
cd chat-dojo
firebase init  # Select Firestore + Storage, use existing project
firebase deploy --only firestore:rules,storage:rules
```

### Step 3: Run the App (30 seconds)

```bash
npm install
npm start
```

Then press `i` for iOS Simulator or scan QR code with Expo Go app.

---

## 🎯 Testing

**You need TWO devices to test messaging:**

Option A: Simulator + Phone

- iOS Simulator + Expo Go on iPhone

Option B: Two Simulators

- Open two iOS simulators

**Create 2 accounts, start chatting!**

---

## ✅ Verify It Works

- [ ] Sign up with email/password
- [ ] Send text message to yourself (on other device)
- [ ] Record and send voice message
- [ ] Enable airplane mode → send message → reconnect (should send)
- [ ] Force-quit app → reopen (messages should persist)

---

## 🆘 Issues?

**"Permission denied"** → Deploy security rules (Step 2)

**"Cannot record audio"** → Grant microphone permission when prompted

**Import errors** → `npm start -- --clear`

**Still stuck?** → See `SETUP_GUIDE.md` for detailed help

---

## 📚 Full Documentation

- `README.md` - Complete documentation
- `SETUP_GUIDE.md` - Detailed setup instructions
- `TEST_CHECKLIST.md` - Comprehensive testing guide
- `MVP_SUMMARY.md` - Implementation overview

---

**Ready? Start with Step 1! 🎉**
