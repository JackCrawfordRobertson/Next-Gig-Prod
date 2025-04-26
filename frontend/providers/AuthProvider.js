"use client";

import { useEffect, createContext, useContext, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth, signOutCompletely } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import mockUsers from "@/app/mock/users";


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
  const redirectInProgress = useRef(false);
  const inLoginPage = useRef(false);

  // Track which page we're on to prevent unnecessary redirects
  useEffect(() => {
    inLoginPage.current = window.location.pathname.includes('/login');
  }, []);

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
      await signOutCompletely();
      
      // Hard redirect to login page
      window.location.href = "/login?signedOut=true";
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      return false;
    }
  };

  // CRITICAL FIX: Handle session recovery instead of immediate redirect
  useEffect(() => {
    // Only run this if we're not loading and not already syncing
    if (isLoading || isAuthSyncing.current || redirectInProgress.current) return;
    
    // If we're on the login page, don't try to fix auth
    if (inLoginPage.current) return;
    
    // Don't do anything if both auth states match (both logged in or both logged out)
    const bothLoggedIn = firebaseUser && session;
    const bothLoggedOut = !firebaseUser && !session;
    if (bothLoggedIn || bothLoggedOut) return;
    
    // Handle the specific case: NextAuth session exists but Firebase auth doesn't
    if (!firebaseUser && session?.user?.email) {
      isAuthSyncing.current = true;
      
      // Try to recover the Firebase session using the credentials from NextAuth
      // This is a more drastic approach but will break the loop
      console.log("Attempting to recover Firebase session...");
      
      // Redirect to login with special parameter to avoid loop
      if (!redirectInProgress.current) {
        redirectInProgress.current = true;
        
        // Use a very clear message
        showToast({
          title: "Session Error",
          description: "Your session needs to be refreshed. Please sign in again.",
          variant: "warning"
        });
        
        // Navigate to login with special recovery parameter
        window.location.href = "/login?action=recover&email=" + encodeURIComponent(session.user.email);
      }
    }
    
    isAuthSyncing.current = false;
  }, [firebaseUser, session, isLoading]);

  // In your AuthProvider
useEffect(() => {
  if (isLoading) return;
  
  // If we have a session but wrong user details
  if (firebaseUser && session && firebaseUser.uid !== session.user.id) {
    console.error("Session mismatch detected", {
      firebaseUid: firebaseUser.uid,
      sessionUserId: session.user.id
    });
    
    // Force a sign out and redirect
    signOutCompletely().then(() => {
      window.location.href = "/login?error=session_mismatch";
    });
  }
}, [firebaseUser, session, isLoading]);

  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV !== 'development') return;
    
    // If we have a session but no Firebase user, and we're in dev mode
    if (session?.user?.id && !firebaseUser && !isLoading) {
      console.log("Dev mode: Ensuring session ID matches mock user ID");
      
      // Check if the session ID exists in our mock users
      if (!mockUsers[session.user.id]) {
        console.warn("Session user ID doesn't match any mock user ID!");
        console.warn("Available mock user IDs:", Object.keys(mockUsers));
        console.warn("Current session ID:", session.user.id);
        
        // This is a development helper message
        showToast({
          title: "Development Mode Warning",
          description: "Session ID doesn't match mock user ID. Check console for details.",
          variant: "destructive"
        });
      }
    }
  }, [session, firebaseUser, isLoading]);

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