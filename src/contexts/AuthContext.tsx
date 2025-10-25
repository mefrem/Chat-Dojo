import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import { User as FirebaseUser } from "firebase/auth";
import * as authService from "@/services/auth";
import { User, AuthContextType } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
  setupNotificationListeners,
} from "@/services/pushNotifications";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const pushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    // Set up notification listeners
    const cleanupListeners = setupNotificationListeners(
      (notification) => {
        // Handle notification received while app is open
        console.log("Notification received:", notification);
      },
      (response) => {
        // Handle notification tapped
        console.log("Notification tapped:", response);
        // TODO: Navigate to the appropriate screen based on notification data
      }
    );

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange(
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          // Fetch full user data from Firestore
          try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName:
                  firebaseUser.displayName || userData.displayName || "",
                createdAt: userData.createdAt?.toMillis() || Date.now(),
                lastSeen: userData.lastSeen?.toMillis() || Date.now(),
                isOnline: userData.isOnline || true,
                fcmToken: userData.fcmToken,
              });

              // Register for push notifications
              try {
                const token = await registerForPushNotifications();
                if (token) {
                  pushTokenRef.current = token;
                  await savePushToken(firebaseUser.uid, token);
                  console.log("Push token registered successfully");
                }
              } catch (error) {
                console.error("Error registering push token:", error);
              }
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        } else {
          setUser(null);
          // Clear push token reference when user logs out
          pushTokenRef.current = null;
        }
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      cleanupListeners();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await authService.signIn(email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      await authService.signUp(email, password, displayName);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Remove push token before signing out
      if (user && pushTokenRef.current) {
        try {
          await removePushToken(user.uid, pushTokenRef.current);
          console.log("Push token removed successfully");
        } catch (error) {
          console.error("Error removing push token:", error);
        }
      }
      await authService.signOut();
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
