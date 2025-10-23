import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNTKJKOxfhYWmksi1l39bNN5GdUebuvXg",
  authDomain: "chat-dojo-mvp.firebaseapp.com",
  projectId: "chat-dojo-mvp",
  storageBucket: "chat-dojo-mvp.firebasestorage.app",
  messagingSenderId: "101546734233",
  appId: "1:101546734233:web:6582e5b0173631dcde7e08",
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firebase Auth
// Note: For React Native, we'll get a warning about persistence but the app will work.
// Auth state will persist in memory during the session.
let auth;
try {
  auth = getAuth(app);
} catch (error: any) {
  if (error.code === "auth/already-initialized") {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

export { auth };

// Initialize Firestore with memory cache (React Native doesn't support IndexedDB)
let db;
try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} catch (error: any) {
  // If already initialized, just get the existing instance
  db = getFirestore(app);
}

export { db };

export const storage = getStorage(app);

export default app;
