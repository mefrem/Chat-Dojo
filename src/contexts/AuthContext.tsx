import React, { createContext, useState, useEffect, useContext } from "react";
import { User as FirebaseUser } from "firebase/auth";
import * as authService from "@/services/auth";
import { User, AuthContextType } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
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
