import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc as firestoreDoc,
  updateDoc as firestoreUpdateDoc,
  getDocs as firestoreGetDocs,
  collection as firestoreCollection,
  getDoc as firestoreGetDoc,
  where as firestoreWhere,
  query as firestoreQuery,
  setDoc as firestoreSetDoc,
  addDoc as firestoreAddDoc,
} from "firebase/firestore";
import { 
  getAuth, 
  setPersistence, 
  browserSessionPersistence,
  signOut as firebaseSignOut
} from "firebase/auth";
import {
  getStorage as realGetStorage,
  ref as storageRef,
  uploadBytes as realUploadBytes,
  getDownloadURL as realGetDownloadURL,
} from "firebase/storage";

import * as mockFirebase from "@/lib/firebase-mock.js";
import * as mockStorage from "@/lib/storage-mock.js";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Improved environment detection logic
let isDevelopment = process.env.NODE_ENV === "development";

// Client-side check for production domains
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  if (hostname.includes('next-gig.co.uk') || 
      hostname.includes('jack-robertson.co.uk') ||
      !(hostname === 'localhost' || hostname === '127.0.0.1')) {
    // Force production mode on production domains
    isDevelopment = false;
  }
}

console.log(`Firebase initializing in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`, {
  environment: process.env.NODE_ENV,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side'
});

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const appUrl = isDevelopment
  ? "http://localhost:3000"
  : "https://next-gig.jack-robertson.co.uk";

// Auth + DB initialization
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set the persistence type to SESSION instead of LOCAL
// This helps prevent persistent logins across browser sessions
if (typeof window !== 'undefined') {
  setPersistence(auth, browserSessionPersistence)
    .then(() => {
      console.log("Firebase auth persistence set to SESSION");
    })
    .catch(error => {
      console.error("Error setting auth persistence:", error);
    });
}

// Enhanced sign out function that ensures both Firebase and cookies are cleared
export const signOutCompletely = async () => {
  try {
    // Add a flag to localStorage to indicate intentional signout
    if (typeof window !== 'undefined') {
      localStorage.setItem('intentionalSignout', 'true');
    }
    
    // Sign out from Firebase
    await firebaseSignOut(auth);
    
    // Clear all storage 
    if (typeof window !== 'undefined') {
      localStorage.removeItem('intentionalSignout'); // Remove after successful Firebase signout
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies (more thorough approach)
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Specifically target auth cookies
      ['next-auth.session-token', 'next-auth.csrf-token', 'next-auth.callback-url', '__Secure-next-auth.session-token'].forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}; secure; samesite=lax`;
      });
      
      // Invalidate any cached data
      if ('caches' in window) {
        try {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        } catch (cacheError) {
          console.warn("Error clearing caches:", cacheError);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error during complete sign out:", error);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('intentionalSignout');
    }
    return false;
  }
};

// Function to check if signout was intentional
export const wasSignoutIntentional = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('intentionalSignout') === 'true';
  }
  return false;
};

// Reset password links configuration
export const actionCodeSettings = {
  url: `${appUrl}/login`,
  handleCodeInApp: false,
};

// Determine if we should use mocks or real implementations
// CRITICAL: We NEVER use mocks in production!
const useMocks = isDevelopment;

// Firestore exports - switch based on environment
export const doc = useMocks ? mockFirebase.doc : firestoreDoc;
export const getDoc = useMocks ? mockFirebase.getDoc : firestoreGetDoc;
export const setDoc = useMocks ? mockFirebase.setDoc : firestoreSetDoc;
export const updateDoc = useMocks ? mockFirebase.updateDoc : firestoreUpdateDoc;
export const getDocs = useMocks ? mockFirebase.getDocs : firestoreGetDocs;
export const collection = useMocks ? mockFirebase.collection : firestoreCollection;
export const where = useMocks ? mockFirebase.where : firestoreWhere;
export const query = useMocks ? mockFirebase.query : firestoreQuery;
export const addDoc = useMocks ? mockFirebase.addDoc : firestoreAddDoc;

// Storage exports - switch based on environment
export const storage = useMocks ? mockStorage.getStorage() : realGetStorage(app);
export const ref = useMocks ? mockStorage.ref : storageRef;
export const uploadBytes = useMocks ? mockStorage.uploadBytes : realUploadBytes;
export const getDownloadURL = useMocks ? mockStorage.getDownloadURL : realGetDownloadURL;

// Utility function to check if a user is currently signed in
export const isUserSignedIn = () => {
  return !!auth.currentUser;
};

// Function to get current auth state synchronously
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Force production mode function (can be called from client components if needed)
export const forceProductionMode = () => {
  if (isDevelopment) {
    console.log("Forcing PRODUCTION mode for Firebase services");
    isDevelopment = false;
  }
};

// Add a helper to validate auth state
export const validateAuthState = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { valid: false, reason: "No Firebase user" };
    }
    
    // Check if the token is valid/not expired
    const idToken = await currentUser.getIdToken(true);
    
    if (!idToken) {
      return { valid: false, reason: "Failed to get ID token" };
    }
    
    return { valid: true, user: currentUser };
  } catch (error) {
    console.error("Error validating auth state:", error);
    return { valid: false, reason: error.message, error };
  }
};