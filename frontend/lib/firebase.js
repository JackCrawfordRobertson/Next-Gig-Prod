// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserSessionPersistence,
  createUserWithEmailAndPassword as firebaseCreateUser,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection, 
  query, 
  where, 
  getDocs,
  addDoc
} from "firebase/firestore";

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

// Initialize Firebase - make sure we only do this once
let app;
let auth;
let db;

// More reliable initialization
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase app:", error);
  }
} else {
  app = getApps()[0];
}

// Initialize auth and firestore
try {
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Set the persistence type to SESSION instead of LOCAL (in browser environments only)
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserSessionPersistence)
      .then(() => {
        console.log("Firebase auth persistence set to SESSION");
      })
      .catch(error => {
        console.error("Error setting auth persistence:", error);
      });
  }
} catch (error) {
  console.error("Error initializing Firebase services:", error);
}

// Create a more reliable createUserWithEmailAndPassword function
const createUserWithEmailAndPassword = async (auth, email, password) => {
  try {
    if (!auth || typeof firebaseCreateUser !== 'function') {
      console.error("Firebase Auth not properly initialized");
      throw new Error("Authentication service unavailable");
    }
    return await firebaseCreateUser(auth, email, password);
  } catch (error) {
    console.error("Error in createUserWithEmailAndPassword:", error);
    throw error;
  }
};

const signOutCompletely = async () => {
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

// Create a more reliable signInWithEmailAndPassword function
const signInWithEmailAndPassword = async (auth, email, password) => {
  try {
    if (!auth || typeof firebaseSignIn !== 'function') {
      console.error("Firebase Auth not properly initialized");
      throw new Error("Authentication service unavailable");
    }
    return await firebaseSignIn(auth, email, password);
  } catch (error) {
    console.error("Error in signInWithEmailAndPassword:", error);
    throw error;
  }
};

// Enhanced sign out function
const signOut = async () => {
  try {
    if (!auth || typeof firebaseSignOut !== 'function') {
      console.error("Firebase Auth not properly initialized");
      throw new Error("Authentication service unavailable");
    }
    return await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error in signOut:", error);
    throw error;
  }
};

// Export everything needed
export {
  app,
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOutCompletely,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc
};