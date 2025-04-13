"use client";

import { useEffect, createContext, useContext, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, wasSignoutIntentional, validateAuthState } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

const AuthContext = createContext({
  firebaseUser: null,
  nextAuthSession: null,
  isLoading: true,
  signOutFromAll: async () => {},
});

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const isAuthSyncing = useRef(false);
  const syncAttempts = useRef(0);
  const MAX_SYNC_ATTEMPTS = 3;

  // Track Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Firebase auth state changed:", user ? "User authenticated" : "No user");
      setFirebaseUser(user);
      if (status !== "loading") {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [status]);

  // Update loading state when NextAuth finishes
  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status]);

  // Comprehensive sign out function
  const signOutFromAll = async () => {
    try {
      // Sign out from Firebase
      await auth.signOut();
      
      // Sign out from NextAuth 
      const response = await fetch('/api/auth/signout', {
        method: 'POST'
      });
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Hard redirect to login page
      window.location.href = "/login?signedOut=true";
      
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      return false;
    }
  };

  // Sync auth states with proper error prevention
  useEffect(() => {
    const syncAuthState = async () => {
      // Skip if still loading or if sync is already in progress
      if (isLoading || isAuthSyncing.current) return;
      
      // Prevent excessive sync attempts
      if (syncAttempts.current >= MAX_SYNC_ATTEMPTS) {
        console.warn("Maximum auth sync attempts reached, stopping sync process");
        return;
      }
      
      isAuthSyncing.current = true;
      syncAttempts.current += 1;
      
      try {
        // If this was an intentional signout, don't try to sync
        if (wasSignoutIntentional()) {
          console.log("Intentional signout detected, skipping auth sync");
          return;
        }
        
        // Case 1: Firebase is logged in but NextAuth isn't
        if (firebaseUser && status === "unauthenticated") {
          console.warn("Auth state inconsistency: Firebase logged in but NextAuth isn't");
          
          // Validate Firebase auth state first
          const validationResult = await validateAuthState();
          
          if (validationResult.valid) {
            // Firebase auth is valid, but NextAuth isn't - try to refresh the page
            console.log("Firebase auth valid but NextAuth session missing, refreshing page");
            showToast({
              title: "Session Error",
              description: "Refreshing your session...",
              variant: "info"
            });
            
            // Use a gentle refresh approach
            window.location.href = "/";
          } else {
            // Firebase auth is invalid, sign out from Firebase
            console.log("Firebase auth invalid, signing out from Firebase");
            await auth.signOut();
          }
        }
        
        // Case 2: NextAuth is logged in but Firebase isn't
        if (!firebaseUser && status === "authenticated" && session?.user?.id) {
          console.warn("Auth state inconsistency: NextAuth session without Firebase");
          
          // Check session validity with the server before taking action
          try {
            const response = await fetch('/api/auth/session', { 
              method: 'GET',
              credentials: 'same-origin'
            });
            
            if (!response.ok) {
              // Session is invalid on the server side, fully sign out
              console.log("Server reports invalid session, signing out");
              await signOutFromAll();
            } else {
              // Session is valid on server but Firebase state is missing
              // This could be a page refresh issue or a new tab - redirect to login
              console.log("Valid NextAuth session but no Firebase user, redirecting to login");
              showToast({
                title: "Session Error",
                description: "Please sign in again to continue",
                variant: "warning"
              });
              
              router.push('/login?error=firebase_session_missing');
            }
          } catch (error) {
            console.error("Error verifying session validity:", error);
            // If we can't verify the session, err on the side of caution
            router.push('/login?error=session_verification_failed');
          }
        }
      } catch (error) {
        console.error("Error during auth state synchronization:", error);
      } finally {
        isAuthSyncing.current = false;
      }
    };
    
    syncAuthState();
  }, [firebaseUser, status, session, isLoading, router]);

  return (
    <AuthContext.Provider value={{ 
      firebaseUser, 
      nextAuthSession: session, 
      isLoading,
      signOutFromAll
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);