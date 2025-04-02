import { doc, getDoc, updateDoc, collection, setDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function checkSubscriptionStatus(userId) {
  try {
    if (!userId) {
      return {
        subscribed: false,
        hadPreviousSubscription: false,
        onTrial: false
      };
    }

    console.log('Checking subscription for userId:', userId);

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`No user found with ID: ${userId}`);
      return {
        subscribed: false,
        hadPreviousSubscription: false,
        onTrial: false
      };
    }

    const userData = userSnap.data();

    console.log('User Snap Details:', {
      exists: true,
      data: userData,
      userId
    });

    return {
      subscribed: !!userData.subscribed,
      onTrial: !!userData.onTrial,
      trialEndDate: userData.trialEndDate || null,
      hadPreviousSubscription: !!userData.hadPreviousSubscription
    };

  } catch (error) {
    console.error("Error checking subscription status:", error);
    return {
      subscribed: false,
      hadPreviousSubscription: false,
      onTrial: false,
      error: true
    };
  }
}

export async function storeSubscription(userId, subscriptionData, deviceFingerprint, options = {}) {
  try {
    console.log("Subscription data received:", subscriptionData);
    
    // Check for previous subscription history
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    // Check subscription history
    const subscriptionsRef = collection(db, 'subscriptions');
    const historyQuery = query(
      subscriptionsRef,
      where('userId', '==', userId),
      where('status', '==', 'cancelled')
    );
    
    const historySnapshot = await getDocs(historyQuery);
    const subscriptionHistory = historySnapshot.docs.map(doc => doc.data());
    const lastCancellation = subscriptionHistory.length > 0 ? 
      subscriptionHistory.sort((a, b) => new Date(b.cancelledAt) - new Date(a.cancelledAt))[0] : null;
    
    // Determine trial eligibility
    let eligibleForTrial = true;
    let trialDuration = 7; // Default trial duration in days
    let trialEligibilityReason = 'First-time subscriber';
    
    if (userData.hadPreviousSubscription) {
      // Check when the last subscription was cancelled
      if (userData.lastCancellationDate || (lastCancellation && lastCancellation.cancelledAt)) {
        const lastCancelDate = userData.lastCancellationDate || lastCancellation.cancelledAt;
        const lastCancellationDate = new Date(lastCancelDate);
        const now = new Date();
        const daysSinceCancellation = Math.ceil(
          (now - lastCancellationDate) / (1000 * 60 * 60 * 24)
        );
        
        // If cancelled within last 30 days, check if trial was already used
        if (daysSinceCancellation < 30) {
          if (userData.trialCompleted) {
            // No new trial if previous one was completed and cancelled recently
            eligibleForTrial = false;
            trialDuration = 0;
            trialEligibilityReason = 'Previous trial completed within last 30 days';
          } else if (userData.trialConsumedDays || (lastCancellation && lastCancellation.trialConsumedDays)) {
            // Partial trial - give remaining days
            const daysConsumed = userData.trialConsumedDays || lastCancellation.trialConsumedDays || 0;
            trialDuration = Math.max(0, 7 - daysConsumed);
            eligibleForTrial = trialDuration > 0;
            trialEligibilityReason = trialDuration > 0 ? 
              `Partial trial (${trialDuration} days remaining)` : 
              'No trial days remaining';
          }
        } else {
          trialEligibilityReason = 'Previous subscription cancelled >30 days ago';
        }
      } else {
        trialEligibilityReason = 'Previous subscription without cancellation data';
      }
    }
    
    // Calculate trial end date
    const onTrial = eligibleForTrial && trialDuration > 0;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + (onTrial ? trialDuration : 0));
    const trialEndDateIso = trialEndDate.toISOString();
    
    // Update user document with subscription details
    await updateDoc(userRef, {
      subscribed: true,
      subscriptionId: subscriptionData.subscriptionID || subscriptionData.subscriptionId,
      subscriptionPlan: "paypal",
      subscriptionStartDate: new Date().toISOString(),
      onTrial: onTrial,
      trialEndDate: onTrial ? trialEndDateIso : null,
      hadPreviousSubscription: true,
      // Store trial consumption data
      trialConsumedDays: userData.trialConsumedDays || 0,
      trialEligibilityReason: trialEligibilityReason
    });

    // Create subscription document with ID from PayPal
    const subscriptionRef = doc(collection(db, "subscriptions"), 
      subscriptionData.subscriptionID || subscriptionData.subscriptionId);
    
    await setDoc(subscriptionRef, {
      userId,
      subscriptionId: subscriptionData.subscriptionID || subscriptionData.subscriptionId,
      status: onTrial ? 'trial' : 'active',
      plan: 'paypal',
      price: 1.99,
      currency: 'GBP',
      paymentMethod: 'paypal',
      startDate: new Date().toISOString(),
      trialEndDate: onTrial ? trialEndDateIso : null,
      createdAt: new Date().toISOString(),
      deviceFingerprint: deviceFingerprint || navigator.userAgent,
      // Store trial eligibility details
      trialEligibility: {
        eligible: eligibleForTrial,
        duration: trialDuration,
        reason: trialEligibilityReason
      },
      // Store reference to previous subscription if available
      previousSubscription: lastCancellation ? {
        subscriptionId: lastCancellation.subscriptionId,
        cancelledAt: lastCancellation.cancelledAt,
        trialConsumedDays: lastCancellation.trialConsumedDays || 0
      } : null
    });

    if (options.showToast) {
      // Handle toast notification if requested
      console.log("Subscription created successfully");
    }

    return {
      success: true,
      subscriptionDocId: subscriptionData.subscriptionID || subscriptionData.subscriptionId,
      trialEndDate: onTrial ? trialEndDateIso : null,
      onTrial: onTrial,
      trialDuration: trialDuration,
      trialEligibilityReason: trialEligibilityReason
    };
  } catch (error) {
    console.error("Error storing subscription:", error);
    throw error;
  }
}

// Helper functions that can be used by other components
export function calculateConsumedTrialDays(startDateStr, endDateStr) {
  if (!startDateStr) return 0;
  
  const startDate = new Date(startDateStr);
  const cancellationDate = new Date();
  const endDate = endDateStr ? new Date(endDateStr) : null;
  
  // If trial end date exists and is in the past, the whole trial was consumed
  if (endDate && endDate < cancellationDate) {
    return 7; // Assuming 7-day trial
  }
  
  // Otherwise calculate days used
  const diffTime = Math.abs(cancellationDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(diffDays, 7); // Cap at 7 days
}

export function hasCompletedTrial(trialEndDateStr) {
  if (!trialEndDateStr) return false;
  
  const trialEndDate = new Date(trialEndDateStr);
  const now = new Date();
  
  return trialEndDate < now;
}