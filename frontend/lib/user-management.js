// lib/user-management.js - New file
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { hash } from "bcryptjs";

/**
 * Create a new user in NextAuth format
 */
export async function createUser(userData) {
  try {
    const { email, password, firstName, lastName, ...restUserData } = userData;
    
    // Check if email already exists
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw new Error("Email already exists");
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user document
    const userDoc = await addDoc(usersRef, {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      emailVerified: new Date().toISOString(),
      image: userData.profilePicture || "/av.svg",
      createdAt: new Date().toISOString(),
      ...restUserData
    });
    
    return {
      id: userDoc.id,
      email,
      firstName,
      lastName
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

/**
 * Check if a user is a tester
 */
export async function isUserTester(email) {
  if (!email) return false;
  
  try {
    const testersRef = collection(db, "testers");
    const q = query(testersRef, where("email", "==", email.toLowerCase()));
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking tester status:", error);
    return false;
  }
}