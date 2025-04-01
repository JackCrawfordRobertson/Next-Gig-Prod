import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc as firestoreDoc,
  updateDoc,
  getDocs,
  collection,
  getDoc as firestoreGetDoc,
  where as firestoreWhere,
  query as firestoreQuery,
} from "firebase/firestore";
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
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);

// Environment checks
const isDevelopment = process.env.NODE_ENV === "development";
const appUrl = isDevelopment
  ? "http://localhost:3000"
  : "https://next.gig.jack-robertson.co.uk";

/**
 * Auth, Firestore, and Storage references
 */
export const auth = getAuth(app);
export const db = getFirestore(app);
const storage = getStorage(app);

/**
 * ActionCodeSettings for password reset (example)
 */
export const actionCodeSettings = {
  url: `${appUrl}/login`,
  handleCodeInApp: false,
};

/**
 * Firestore: real vs. mock exports
 */
export const doc = isDevelopment ? mockFirebase.doc : firestoreDoc;
export const getDoc = isDevelopment ? mockFirebase.getDoc : firestoreGetDoc;

// If you want to mock these, add them to your mock file; otherwise you'll get errors in dev
export const where = isDevelopment ? mockFirebase.where : firestoreWhere;
export const query = isDevelopment ? mockFirebase.query : firestoreQuery;

/**
 * Exports that do not differ between dev/prod (unless you have mocks for them).
 */
export { updateDoc, getDocs, collection };

/**
 * Example setDoc export
 * If you need setDoc in dev mode, implement mockFirebase.setDoc
 * If not, remove this or do real setDoc only
 */
export const setDoc = isDevelopment ? mockFirebase.setDoc : null;

/**
 * Storage: real vs. mock
 */
export const ref = isDevelopment ? mockStorage.ref : storage.ref;
export const uploadBytes = isDevelopment
  ? mockStorage.uploadBytes
  : storage.uploadBytes;
export const getDownloadURL = isDevelopment
  ? mockStorage.getDownloadURL
  : storage.getDownloadURL;
