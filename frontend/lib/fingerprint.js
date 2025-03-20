// lib/fingerprint.js
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { collection, query, where, getDocs } from "firebase/firestore";

let fpPromise = null;

export const getFingerprint = async () => {
  if (!fpPromise) {
    // Initialize the agent only once
    fpPromise = FingerprintJS.load();
  }

  try {
    const fp = await fpPromise;
    const result = await fp.get();
    
    // The visitorId is the fingerprint we'll use for fraud detection
    return result.visitorId;
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    return null;
  }
};

export const checkForFraudPatterns = async (db, fingerprint) => {
  // This is a simplified fraud check
  // In a real application, you would implement more sophisticated checks
  
  try {
    // Using Firebase v9 syntax for Firestore queries
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(
      subscriptionsRef,
      where('fingerprint', '==', fingerprint),
      where('status', 'in', ['trial', 'active'])
    );
    
    const querySnapshot = await getDocs(q);
    
    // If this fingerprint already has active subscriptions, flag it
    return {
      isSuspicious: !querySnapshot.empty,
      existingSubscriptions: querySnapshot.docs.map(doc => doc.data()),
    };
  } catch (error) {
    console.error('Error checking for fraud patterns:', error);
    return { isSuspicious: false, error: error.message };
  }
};