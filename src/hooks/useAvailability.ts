import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { updateUserAvailability } from "../services/user";
import { getCurrentUser } from "../services/auth";

/**
 * Hook to manage user availability status based on app state
 * Automatically updates availability when app goes to background/foreground
 */
export function useAvailability() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    // Set user online when component mounts
    updateUserAvailability(user.uid, "online").catch((error) => {
      console.error("Error updating availability on mount:", error);
    });

    // Handle app state changes
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // App came to foreground - set online
          updateUserAvailability(user.uid, "online").catch((error) => {
            console.error("Error setting online:", error);
          });
        } else if (
          appState.current === "active" &&
          nextAppState.match(/inactive|background/)
        ) {
          // App went to background - set offline
          updateUserAvailability(user.uid, "offline").catch((error) => {
            console.error("Error setting offline:", error);
          });
        }

        appState.current = nextAppState;
      }
    );

    // Clean up on unmount - set offline
    return () => {
      subscription.remove();
      // Check if user is still authenticated before updating
      const currentUser = getCurrentUser();
      if (currentUser) {
        updateUserAvailability(currentUser.uid, "offline").catch((error) => {
          // Silently fail if user is logged out - this is expected behavior
          console.log(
            "Could not update availability on unmount (user may be logged out):",
            error.message
          );
        });
      }
    };
  }, []);
}

/**
 * Hook to set user as "in-conversation" when in a conversation screen
 * and restore to "online" when leaving
 */
export function useConversationAvailability(conversationId?: string) {
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !conversationId) return;

    // Set user as in-conversation
    updateUserAvailability(user.uid, "in-conversation").catch((error) => {
      console.error("Error setting in-conversation:", error);
    });

    // Restore to online when leaving
    return () => {
      // Check if user is still authenticated before updating
      const currentUser = getCurrentUser();
      if (currentUser) {
        updateUserAvailability(currentUser.uid, "online").catch((error) => {
          // Silently fail if user is logged out
          console.log(
            "Could not restore to online (user may be logged out):",
            error.message
          );
        });
      }
    };
  }, [conversationId]);
}
