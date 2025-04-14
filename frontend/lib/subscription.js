// lib/subscription.js
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { showToast } from "@/lib/toast";

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
 * Comprehensive function to get a user's current subscription status
 */
export async function getUserSubscriptionStatus(userId) {
  try {
    if (!userId) {
      console.warn("getUserSubscriptionStatus called without userId");
      return { 
        subscribed: false, 
        hadPreviousSubscription: false, 
        onTrial: false, 
        error: "No user ID provided" 
      };
    }

    console.log("Checking subscription for userId:", userId);

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`No user found with ID: ${userId}`);
      return {
        subscribed: false,
        hadPreviousSubscription: false,
        onTrial: false,
        error: "User not found"
      };
    }

    const userData = userSnap.data();

    if (userData.email) {
      const isTester = await isUserTester(userData.email);

      if (!isTester) {
        const usersRef = collection(db, "users");
        const ipQuery = query(usersRef, where("userIP", "==", userData.userIP));
        const fingerprintQuery = query(
          usersRef,
          where("deviceFingerprint", "==", userData.deviceFingerprint)
        );

        const [ipSnapshot, fingerprintSnapshot] = await Promise.all([
          getDocs(ipQuery),
          getDocs(fingerprintQuery)
        ]);

        if (!ipSnapshot.empty || !fingerprintSnapshot.empty) {
          const farFutureDate = new Date();
          farFutureDate.setFullYear(farFutureDate.getFullYear() + 10);

          return {
            subscribed: true,
            onTrial: true,
            hasSubscription: true,
            isOnTrial: true,
            trialEndDate: farFutureDate.toISOString(),
            isTester: true,
            userData: userData,
            subscriptionData: {
              status: "trial",
              plan: "tester"
            },
            subscriptionDocId: "tester-" + userId
          };
        }
      }
    }

    let subscriptionData = null;
    let subscriptionDocId = null;

    if (userData.subscriptionId) {
      try {
        const subscriptionRef = doc(db, "subscriptions", userData.subscriptionId);
        const subSnap = await getDoc(subscriptionRef);

        if (subSnap.exists()) {
          subscriptionData = subSnap.data();
          subscriptionDocId = userData.subscriptionId;
        }
      } catch (err) {
        console.warn("Error fetching subscription details:", err);
      }
    }

    if (!subscriptionData && (userData.subscribed || userData.onTrial)) {
      try {
        const subQuery = query(
          collection(db, "subscriptions"),
          where("userId", "==", userId),
          where("status", "in", ["active", "trial"])
        );

        const querySnap = await getDocs(subQuery);

        if (!querySnap.empty) {
          const docSnap = querySnap.docs[0];
          subscriptionData = docSnap.data();
          subscriptionDocId = docSnap.id;
        }
      } catch (err) {
        console.warn("Error querying subscriptions:", err);
      }
    }

    console.log("User Subscription Details:", {
      exists: true,
      userData: userData,
      subscriptionData: subscriptionData,
      userId
    });

    return {
      subscribed: !!userData.subscribed,
      onTrial: !!userData.onTrial,
      hasSubscription: !!userData.subscribed || !!userData.onTrial,
      isOnTrial: !!userData.onTrial,
      trialEndDate: userData.trialEndDate || null,
      hadPreviousSubscription: !!userData.hadPreviousSubscription,
      userData: userData,
      subscriptionData: subscriptionData,
      subscriptionDocId: subscriptionDocId
    };
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return {
      subscribed: false,
      hadPreviousSubscription: false,
      onTrial: false,
      hasSubscription: false,
      error: error.message || "Unknown error checking subscription"
    };
  }
}


/**
 * Store a new subscription in Firestore
 */
export async function storeSubscription(userId, subscriptionData, deviceFingerprint, options = {}) {
  try {
    const showToastNotifications = options.showToast || false;
    
    if (!userId || !subscriptionData) {
      throw new Error("Missing required parameters");
    }
    
    console.log("Storing subscription for user:", userId);
    
    // Normalise subscription ID to use consistent naming
    const subscriptionId = subscriptionData.subscriptionID || subscriptionData.subscriptionId;
    if (!subscriptionId) {
      throw new Error("Missing subscription ID in data");
    }
    
    // Get user data to check trial eligibility
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error("User document not found");
    }
    
    const userData = userSnap.data();
    
    // Check if user is a tester (don't process payment if they are)
    if (userData.email) {
      const isTester = await isUserTester(userData.email);
      if (isTester) {
        console.log(`User ${userData.email} is a tester - no need to process payment`);
        
        // Calculate a date far in the future
        const farFutureDate = new Date();
        farFutureDate.setFullYear(farFutureDate.getFullYear() + 10);
        
        // Update user document to mark as tester
        await updateDoc(userRef, {
          subscribed: true,
          onTrial: true,
          isTester: true,
          trialEndDate: farFutureDate.toISOString(),
          subscriptionVerified: true,
          subscriptionActive: true
        });
        
        if (showToastNotifications) {
          showToast({
            title: "Tester Account Activated",
            description: "You have unlimited access as a tester. Thank you for helping test Next Gig!",
            variant: "success",
          });
        }
        
        return {
          success: true,
          isTester: true,
          subscriptionDocId: "tester-" + userId
        };
      }
    }
    
    // Determine trial eligibility and duration
    const { 
      eligibleForTrial, 
      trialDuration, 
      trialEndDate, 
      trialEligibilityReason 
    } = await determineTrialEligibility(userId, userData);
    
    // Update user document
    await updateDoc(userRef, {
      subscribed: true,
      subscriptionId: subscriptionId,
      subscriptionPlan: "paypal",
      subscriptionStartDate: new Date().toISOString(),
      onTrial: eligibleForTrial,
      trialEndDate: eligibleForTrial ? trialEndDate.toISOString() : null,
      hadPreviousSubscription: true,
      subscriptionVerified: true,
      subscriptionActive: true
    });
    
    // Create subscription document with explicit ID
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    
    await setDoc(subscriptionRef, {
      userId,
      subscriptionId: subscriptionId,
      status: eligibleForTrial ? 'trial' : 'active',
      plan: 'paypal',
      price: 2.99,
      currency: 'GBP',
      paymentMethod: 'paypal',
      startDate: new Date().toISOString(),
      trialEndDate: eligibleForTrial ? trialEndDate.toISOString() : null,
      createdAt: new Date().toISOString(),
      deviceFingerprint: deviceFingerprint || navigator.userAgent,
      trialEligibility: {
        eligible: eligibleForTrial,
        duration: trialDuration,
        reason: trialEligibilityReason
      }
    });
    
    if (showToastNotifications) {
      showToast({
        title: eligibleForTrial ? "Trial Activated!" : "Subscription Activated!",
        description: eligibleForTrial 
          ? `Your ${trialDuration}-day trial has been activated.`
          : "Your subscription has been successfully activated.",
        variant: "success",
      });
    }
    
    return {
      success: true,
      subscriptionDocId: subscriptionId,
      onTrial: eligibleForTrial,
      trialEndDate: eligibleForTrial ? trialEndDate.toISOString() : null,
      trialDuration,
      trialEligibilityReason
    };
  } catch (error) {
    console.error("Error storing subscription:", error);
    
    if (options.showToast) {
      showToast({
        title: "Subscription Error",
        description: "There was an error activating your subscription. Please try again.",
        variant: "destructive",
      });
    }
    
    throw error;
  }
}

/**
 * Helper function to determine trial eligibility 
 */
async function determineTrialEligibility(userId, userData) {
  // Default values
  let eligibleForTrial = true;
  let trialDuration = 7; // Default trial duration in days
  let trialEligibilityReason = 'First-time subscriber';
  
  // Check subscription history
  const subscriptionsRef = collection(db, 'subscriptions');
  const historyQuery = query(
    subscriptionsRef,
    where('userId', '==', userId),
    where('status', '==', 'cancelled')
  );
  
  const historySnapshot = await getDocs(historyQuery);
  const subscriptionHistory = historySnapshot.docs.map(doc => doc.data());
  
  // Sort cancelled subscriptions by cancellation date, newest first
  const lastCancellation = subscriptionHistory.length > 0 ? 
    subscriptionHistory.sort((a, b) => 
      new Date(b.cancelledAt || 0) - new Date(a.cancelledAt || 0)
    )[0] : null;
  
  if (userData.hadPreviousSubscription || lastCancellation) {
    // Determine when the last subscription was cancelled
    const lastCancelDate = userData.lastCancellationDate || 
                          (lastCancellation?.cancelledAt) || null;
    
    if (lastCancelDate) {
      const lastCancellationDate = new Date(lastCancelDate);
      const now = new Date();
      const daysSinceCancellation = Math.floor(
        (now - lastCancellationDate) / (1000 * 60 * 60 * 24)
      );
      
      // If cancelled within last 30 days, more restrictive rules apply
      if (daysSinceCancellation < 30) {
        if (userData.trialCompleted) {
          // No new trial if previous trial was completed and cancelled recently
          eligibleForTrial = false;
          trialDuration = 0;
          trialEligibilityReason = 'Previous trial completed within last 30 days';
        } else if (userData.trialConsumedDays || (lastCancellation?.trialConsumedDays)) {
          // Partial trial - give remaining days
          const daysConsumed = userData.trialConsumedDays || 
                              lastCancellation?.trialConsumedDays || 0;
          
          // FIXED: Use Math.floor instead of Math.max to be consistent with frontend calculation
          trialDuration = Math.floor(7 - daysConsumed);
          eligibleForTrial = trialDuration > 0;
          trialEligibilityReason = trialDuration > 0 ? 
          `Resuming previous trial (${trialDuration} days remaining from your last subscription)` : 
          'No trial days remaining from your previous subscription';
        }
      } else {
        // More than 30 days since cancellation - full trial
        trialEligibilityReason = 'Previous subscription cancelled >30 days ago';
      }
    }
  }
  
  // Calculate trial end date
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + (eligibleForTrial ? trialDuration : 0));
  
  return {
    eligibleForTrial,
    trialDuration,
    trialEndDate,
    trialEligibilityReason
  };
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(userId, subscriptionId, subscriptionDocId) {
  try {
    if (!userId || !subscriptionId) {
      throw new Error("Missing required parameters");
    }
    
    // Calculate days of trial used (if applicable)
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error("User document not found");
    }
    
    const userData = userSnap.data();
    
    // Check if user is a tester
    if (userData.email && userData.isTester) {
      const isTester = await isUserTester(userData.email);
      if (isTester) {
        console.log(`Tester ${userData.email} cannot cancel subscription - skipping cancellation`);
        return {
          success: true,
          isTester: true,
          message: "Tester accounts cannot be cancelled"
        };
      }
    }
    
    // Calculate days of trial used
    const trialConsumedDays = calculateTrialConsumedDays(
      userData.subscriptionStartDate,
      userData.trialEndDate
    );
    
    // Determine if trial was fully completed
    const trialCompleted = hasCompletedTrial(userData.trialEndDate);
    
    // Update subscription document
    const subDocRef = doc(db, "subscriptions", subscriptionDocId || subscriptionId);
    await updateDoc(subDocRef, {
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      trialUsed: userData.onTrial || false,
      trialConsumedDays: trialConsumedDays
    });
    
    // Update user document
    await updateDoc(userRef, {
      subscribed: false,
      onTrial: false,
      subscriptionActive: false,
      trialCompleted: trialCompleted,
      lastCancellationDate: new Date().toISOString(),
      trialConsumedDays: trialConsumedDays
    });
    
    return {
      success: true,
      trialConsumedDays,
      trialCompleted
    };
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    throw error;
  }
}

// FIXED: Updated calculation method to use Math.floor for consistent calculations
export function calculateTrialConsumedDays(startDateStr, endDateStr) {
  if (!startDateStr) return 0;
  
  const startDate = new Date(startDateStr);
  const now = new Date();
  const endDate = endDateStr ? new Date(endDateStr) : null;
  
  // If trial end date exists and is in the past, the whole trial was consumed
  if (endDate && endDate < now) {
    return 7; // Assuming 7-day trial
  }
  
  // Otherwise calculate days used - use floor instead of ceil
  const diffTime = Math.abs(now - startDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(diffDays, 7); // Cap at 7 days
}

// ADDED: New function to consistently calculate remaining days
export function calculateRemainingTrialDays(endDateStr) {
  if (!endDateStr) return 0;
  
  const endDate = new Date(endDateStr);
  const now = new Date();
  
  // If trial has already ended
  if (endDate <= now) return 0;
  
  const diffTime = Math.abs(endDate - now);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function hasCompletedTrial(trialEndDateStr) {
  if (!trialEndDateStr) return false;
  
  const trialEndDate = new Date(trialEndDateStr);
  const now = new Date();
  
  return trialEndDate < now;
}

/**
 * Log subscription event for analytics/debugging
 */
export async function logSubscriptionEvent(userId, eventType, details = {}) {
  try {
    if (!userId || !eventType) return;
    
    await addDoc(collection(db, "subscription_logs"), {
      userId,
      eventType,
      details,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
    });
    
    console.log(`Subscription event logged: ${eventType}`);
  } catch (error) {
    console.error("Error logging subscription event:", error);
  }
}

export const calculateConsumedTrialDays = calculateTrialConsumedDays;