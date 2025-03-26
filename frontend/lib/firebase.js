import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDocs, collection, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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

// Export Firestore functions
export { doc, updateDoc, getDocs, collection, getDoc };