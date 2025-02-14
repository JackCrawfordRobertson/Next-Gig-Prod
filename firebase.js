// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// 🔥 Your Firebase config (replace with your actual Firebase credentials)
const firebaseConfig = {
    apiKey: "AIzaSyDRsxJ0pscSNeeOOlgA3Db_2e9D9OQEH0w",
    authDomain: "job-bot-82f01.firebaseapp.com",
    projectId: "job-bot-82f01",
    storageBucket: "job-bot-82f01.firebasestorage.app",
    messagingSenderId: "341586999516",
    appId: "1:341586999516:web:b8e475b8ca1833b7ae1c19",
    measurementId: "G-ZFES9RKVMV"
  };

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs };