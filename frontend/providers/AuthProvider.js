"use client";

import { useEffect, createContext, useContext, useState } from "react";
import { useSession, signOut as signOutNextAuth } from "next-auth/react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

// Create context with default values
const AuthContext = createContext({
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Track Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Firebase auth state changed:", user ? "Authenticated" : "Not authenticated");
      setFirebaseUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Update loading state when both auth systems have responded
  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status]);

// In AuthProvider.js
useEffect(() => {
  // Only run once both systems have reported their state
  if (isLoading) return;
  
  // Check for the case where NextAuth session exists but Firebase user doesn't
  if (session && !firebaseUser) {
    console.log("Auth state mismatch detected: NextAuth session exists but Firebase user doesn't");
    
    // We need to avoid constantly showing this message
    const isLoginPage = window.location.pathname.includes('/login');
    const isCompletingProfile = window.location.pathname.includes('/complete-profile');
    
    // Only try to recover in main app areas, not during login/registration
    if (!isLoginPage && !isCompletingProfile) {
      // Try to restore Firebase session from NextAuth if possible
      if (session.user?.email && session.user?.id) {
        // Here you would implement a session recovery mechanism
        // For now, just notify the user
        showToast({
          title: "Session Refreshing",
          description: "Please wait while we restore your session...",
          variant: "info",
        });
        
        // For a simple fix, you could redirect to login with recovery info
        setTimeout(() => {
          window.location.href = `/login?action=recover&email=${encodeURIComponent(session.user.email)}`;
        }, 3000);
      }
    }
  }
}, [session, firebaseUser, isLoading]);

  // Comprehensive sign out function
  const signOutCompletely = async () => {
    try {
      // First sign out from Firebase
      await firebaseSignOut(auth);
      
      // Then sign out from NextAuth
      await signOutNextAuth({
        callbackUrl: "/login?signedOut=true",
      });
      
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      
      // As a fallback, force redirect to login
      window.location.href = "/login?signedOut=true";
      return false;
    }
  };

  // Context value to expose to consumers
  const contextValue = {
    session,
    status,
    isLoading,
    signOut: signOutCompletely,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
};