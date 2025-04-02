import { doc, getDoc } from "firebase/firestore";
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

export async function storeSubscription(userId, subscriptionData) {
  try {
    // Update user document with subscription details
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      subscribed: true,
      subscriptionId: subscriptionData.id,
      subscriptionPlan: subscriptionData.plan,
      subscriptionStartDate: new Date().toISOString(),
      onTrial: subscriptionData.status === 'trial',
      trialEndDate: subscriptionData.trialEndDate,
      hadPreviousSubscription: true
    });

    // Create or update subscription document
    const subscriptionRef = doc(collection(db, "subscriptions"), subscriptionData.id);
    await setDoc(subscriptionRef, {
      userId,
      ...subscriptionData,
      createdAt: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error("Error storing subscription:", error);
    throw error;
  }
}