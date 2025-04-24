// lib/testerUtils.js
import { db, collection, query, where, getDocs, addDoc, deleteDoc, doc } from "@/lib/firebase";

/**
 * Check if a user is a tester
 * @param {string} email - User's email address
 * @returns {Promise<boolean>} True if user is a tester
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

/**
 * Add a new tester to the database
 * @param {string} email - User's email address
 * @param {string} notes - Optional notes about the tester
 * @returns {Promise<string>} ID of the new tester document
 */
export async function addTester(email, notes = "") {
  if (!email) throw new Error("Email is required");
  
  try {
    // Check if tester already exists
    const isAlreadyTester = await isUserTester(email);
    if (isAlreadyTester) {
      console.log(`User ${email} is already a tester`);
      return null;
    }
    
    // Add new tester document
    const docRef = await addDoc(collection(db, "testers"), {
      email: email.toLowerCase(),
      addedOn: new Date().toISOString(),
      notes: notes
    });
    
    console.log(`Added new tester: ${email}`);
    return docRef.id;
  } catch (error) {
    console.error("Error adding tester:", error);
    throw error;
  }
}

/**
 * Remove a tester from the database
 * @param {string} email - User's email address
 * @returns {Promise<boolean>} True if tester was successfully removed
 */
export async function removeTester(email) {
  if (!email) throw new Error("Email is required");
  
  try {
    const testersRef = collection(db, "testers");
    const q = query(testersRef, where("email", "==", email.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`No tester found with email: ${email}`);
      return false;
    }
    
    // Delete the tester document
    await deleteDoc(doc(db, "testers", snapshot.docs[0].id));
    console.log(`Removed tester: ${email}`);
    return true;
  } catch (error) {
    console.error("Error removing tester:", error);
    throw error;
  }
}

/**
 * Get all testers
 * @returns {Promise<Array>} Array of tester objects
 */
export async function getAllTesters() {
  try {
    const testersRef = collection(db, "testers");
    const snapshot = await getDocs(testersRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting testers:", error);
    return [];
  }
}