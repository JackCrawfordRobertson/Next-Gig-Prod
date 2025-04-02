import { doc, getDoc, updateDoc, collection, setDoc } from "firebase/firestore";
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
    
    // Calculate trial end date (7 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    const trialEndDateIso = trialEndDate.toISOString();
    
    // Update user document with subscription details
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      subscribed: true,
      subscriptionId: subscriptionData.subscriptionID || subscriptionData.subscriptionId, // Handle both formats
      subscriptionPlan: "paypal", // PayPal doesn't provide a plan name
      subscriptionStartDate: new Date().toISOString(),
      onTrial: true,
      trialEndDate: trialEndDateIso,
      hadPreviousSubscription: true
    });

    // Create subscription document
    const subscriptionRef = doc(collection(db, "subscriptions"), 
      subscriptionData.subscriptionID || subscriptionData.subscriptionId);
    await setDoc(subscriptionRef, {
      userId,
      subscriptionId: subscriptionData.subscriptionID || subscriptionData.subscriptionId,
      status: 'trial',
      plan: 'paypal',
      price: 1.99,
      currency: 'GBP',
      paymentMethod: 'paypal',
      startDate: new Date().toISOString(),
      trialEndDate: trialEndDateIso,
      createdAt: new Date().toISOString(),
      deviceFingerprint: deviceFingerprint || navigator.userAgent
    });

    if (options.showToast) {
      // Handle toast notification if requested
      console.log("Subscription created successfully");
    }

    return {
      success: true,
      subscriptionDocId: subscriptionData.subscriptionID || subscriptionData.subscriptionId,
      trialEndDate: trialEndDateIso
    };
  } catch (error) {
    console.error("Error storing subscription:", error);
    throw error;
  }
}