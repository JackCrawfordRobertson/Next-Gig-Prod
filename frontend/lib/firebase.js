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
  browserLocalPersistence, 
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

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const isDevelopment = process.env.NODE_ENV === "development";
const appUrl = isDevelopment
  ? "http://localhost:3000"
  : "https://next.gig.jack-robertson.co.uk";

// Auth + DB initialization
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set the persistence type to SESSION instead of LOCAL
// This helps prevent persistent logins across browser sessions
if (typeof window !== 'undefined') {
  setPersistence(auth, browserSessionPersistence).catch(error => {
    console.error("Error setting auth persistence:", error);
  });
}

// Enhanced sign out function that ensures both Firebase and cookies are cleared
export const signOutCompletely = async () => {
  try {
    // Sign out from Firebase
    await firebaseSignOut(auth);
    
    // Clear cookies (more thorough approach)
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Clear local storage
    localStorage.clear();
    sessionStorage.clear();
    
    return true;
  } catch (error) {
    console.error("Error during complete sign out:", error);
    return false;
  }
};

// Reset password links configuration
export const actionCodeSettings = {
  url: `${appUrl}/login`,
  handleCodeInApp: false,
};

// Firestore exports - uses mock implementations in development
export const doc = isDevelopment ? mockFirebase.doc : firestoreDoc;
export const getDoc = isDevelopment ? mockFirebase.getDoc : firestoreGetDoc;
export const setDoc = isDevelopment ? mockFirebase.setDoc : firestoreSetDoc;
export const updateDoc = isDevelopment ? mockFirebase.updateDoc : firestoreUpdateDoc;
export const getDocs = isDevelopment ? mockFirebase.getDocs : firestoreGetDocs;
export const collection = isDevelopment ? mockFirebase.collection : firestoreCollection;
export const where = isDevelopment ? mockFirebase.where : firestoreWhere;
export const query = isDevelopment ? mockFirebase.query : firestoreQuery;
export const addDoc = isDevelopment ? mockFirebase.addDoc : firestoreAddDoc;

// Storage exports - uses mock implementations in development
export const storage = isDevelopment
  ? mockStorage.getStorage()
  : realGetStorage(app);
export const ref = isDevelopment ? mockStorage.ref : storageRef;
export const uploadBytes = isDevelopment ? mockStorage.uploadBytes : realUploadBytes;
export const getDownloadURL = isDevelopment ? mockStorage.getDownloadURL : realGetDownloadURL;

// Utility function to check if a user is currently signed in
export const isUserSignedIn = () => {
  return !!auth.currentUser;
};

// Function to get current auth state synchronously
export const getCurrentUser = () => {
  return auth.currentUser;
};