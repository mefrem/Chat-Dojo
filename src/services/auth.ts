import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Sign up a new user
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isOnline: true,
    });

    return user;
  } catch (error: any) {
    console.error("Sign up error:", error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign in existing user
 */
export async function signIn(
  email: string,
  password: string
): Promise<FirebaseUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update user's online status and last seen
    await setDoc(
      doc(db, "users", userCredential.user.uid),
      {
        isOnline: true,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );

    return userCredential.user;
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    const user = auth.currentUser;
    if (user) {
      // Update user's online status before signing out
      await setDoc(
        doc(db, "users", user.uid),
        {
          isOnline: false,
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );
    }
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in instead.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/operation-not-allowed":
      return "Email/password accounts are not enabled. Please contact support.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
      return "No account found with this email. Please sign up first.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    default:
      return "An error occurred. Please try again.";
  }
}
