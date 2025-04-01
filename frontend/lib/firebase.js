import { initializeApp } from "firebase/app";
import { getFirestore, doc as firestoreDoc, updateDoc, getDocs, collection, getDoc as firestoreGetDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Import mock implementations when in development/test mode
import * as mockFirebase from "@/lib/firebase-mock.js";
import * as mockStorage from "@/lib/storage-mock.js";

// Load Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const storage = getStorage(app);

// Determine the appropriate app URL based on environment
const isDevelopment = process.env.NODE_ENV === "development";
const appUrl = isDevelopment 
  ? "http://localhost:3000" 
  : "https://next.gig.jack-robertson.co.uk";

// Configure ActionCodeSettings for password reset
export const actionCodeSettings = {
  url: `${appUrl}/login`,
  handleCodeInApp: false,
};

// Export the appropriate functions based on environment
export const doc = isDevelopment ? mockFirebase.doc : firestoreDoc;
export const getDoc = isDevelopment ? mockFirebase.getDoc : firestoreGetDoc;
export { updateDoc, getDocs, collection };
export const setDoc = isDevelopment ? mockFirebase.setDoc : null; // Add real setDoc if needed

// Export storage-related functions based on environment
export const ref = isDevelopment ? mockStorage.ref : storage.ref;
export const uploadBytes = isDevelopment ? mockStorage.uploadBytes : storage.uploadBytes;
export const getDownloadURL = isDevelopment ? mockStorage.getDownloadURL : storage.getDownloadURL;