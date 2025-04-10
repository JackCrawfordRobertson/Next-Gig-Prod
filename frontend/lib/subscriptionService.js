// lib/subscriptionService.js
import { db, doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from "@/lib/firebase";
import { showToast } from "@/lib/toast";

/**
 * Comprehensive function to get a user's current subscription status
 */
export async function getUserSubscriptionStatus(userId) {
  try {
    if (!userId) {
      console.warn("getUserSubscriptionStatus called without userId");
      return { hasSubscription: false, isLoading: false, error: "No user ID provided" };
    }

    // Get user document first
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.warn(`No user document found for ID: ${userId}`);
      return { hasSubscription: false, isLoading: false, error: "User not found" };
    }
    
    const userData = userSnap.data();
    
    // Check if we need to refresh subscription info by querying subscriptions collection
    let needsRefresh = false;
    let refreshReason = "";
    
    // If user says they're subscribed but no subscription ID
    if (userData.subscribed && !userData.subscriptionId) {
      needsRefresh = true;
      refreshReason = "User marked as subscribed but missing subscriptionId";
    }
    
    // If subscription end date exists and has passed
    if (userData.onTrial && userData.trialEndDate) {
      const trialEndDate = new Date(userData.trialEndDate);
      const now = new Date();
      if (trialEndDate < now) {
        needsRefresh = true;
        refreshReason = "Trial period has ended";
      }
    }
    
    // If not subscribed but we want to double-check
    if (!userData.subscribed) {
      // We'll still check the subscriptions collection to see if there's an active subscription
      // that wasn't properly updated in the user document
      needsRefresh = true;
      refreshReason = "Verifying no active subscriptions exist";
    }
    
    // If refresh needed, check subscription collection
    let subscriptionData = null;
    let subscriptionDocId = null;
    
    if (needsRefresh) {
      console.log(`Refreshing subscription data: ${refreshReason}`);
      const subQuery = query(
        collection(db, "subscriptions"),
        where("userId", "==", userId),
        where("status", "in", ["active", "trial"])
      );
      
      const subQuerySnap = await getDocs(subQuery);
      
      if (!subQuerySnap.empty) {
        // Found active subscription
        const docSnap = subQuerySnap.docs[0];
        subscriptionData = docSnap.data();
        subscriptionDocId = docSnap.id;
        
        // Update user document to match current subscription state
        const updates = {
          subscribed: true,
          subscriptionId: subscriptionData.subscriptionId,
          subscriptionPlan: subscriptionData.plan || "paypal",
          onTrial: subscriptionData.status === "trial",
        };
        
        if (subscriptionData.trialEndDate) {
          updates.trialEndDate = subscriptionData.trialEndDate;
        }
        
        await updateDoc(userRef, updates);
        console.log("Updated user document with current subscription data", updates);
      } else if (userData.subscribed) {
        // No active subscription found but user document says subscribed
        // Update user document to correct the inconsistency
        await updateDoc(userRef, {
          subscribed: false,
          onTrial: false
        });
        console.log("Corrected user document - no active subscription found");
      }
    } else {
      // Use subscription ID from user data to fetch the full subscription
      if (userData.subscriptionId) {
        const subscriptionRef = doc(db, "subscriptions", userData.subscriptionId);
        const subscriptionSnap = await getDoc(subscriptionRef);
        
        if (subscriptionSnap.exists()) {
          subscriptionData = subscriptionSnap.data();
          subscriptionDocId = userData.subscriptionId;
        }
      }
    }
    
    return {
      hasSubscription: !!subscriptionData,
      isLoading: false,
      userData,
      subscriptionData,
      subscriptionDocId,
      isOnTrial: subscriptionData?.status === "trial" || userData?.onTrial || false
    };
  } catch (error) {
    console.error("Error in getUserSubscriptionStatus:", error);
    return { 
      hasSubscription: false, 
      isLoading: false, 
      error: error.message || "Failed to retrieve subscription status" 
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
    
    // Normalize subscription ID to use consistent naming
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
      const daysSinceCancellation = Math.ceil(
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
          trialDuration = Math.max(0, 7 - daysConsumed);
          eligibleForTrial = trialDuration > 0;
          trialEligibilityReason = trialDuration > 0 ? 
            `Partial trial (${trialDuration} days remaining)` : 
            'No trial days remaining';
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

// Helper functions
function calculateTrialConsumedDays(startDateStr, endDateStr) {
  if (!startDateStr) return 0;
  
  const startDate = new Date(startDateStr);
  const now = new Date();
  const endDate = endDateStr ? new Date(endDateStr) : null;
  
  // If trial end date exists and is in the past, the whole trial was consumed
  if (endDate && endDate < now) {
    return 7; // Assuming 7-day trial
  }
  
  // Otherwise calculate days used
  const diffTime = Math.abs(now - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(diffDays, 7); // Cap at 7 days
}

function hasCompletedTrial(trialEndDateStr) {
  if (!trialEndDateStr) return false;
  
  const trialEndDate = new Date(trialEndDateStr);
  const now = new Date();
  
  return trialEndDate < now;
}