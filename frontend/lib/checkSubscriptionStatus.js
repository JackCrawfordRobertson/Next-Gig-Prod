import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function checkSubscriptionStatus(userId) {
  try {
    if (!userId) return { 
      subscribed: false, 
      hadPreviousSubscription: false, 
      onTrial: false 
    };
    
    // Log the userId being queried
    console.log('Checking subscription for userId:', userId);
    
    // Get user document
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    // Log detailed information about the user snap
    console.log('User Snap Details:', {
      exists: userSnap.exists(),
      data: userSnap.exists() ? userSnap.data() : 'No data',
      userId: userId
    });

    if (!userSnap.exists()) {
      console.warn(`No user found with ID: ${userId}`);
      return { 
        subscribed: false, 
        hadPreviousSubscription: false, 
        onTrial: false 
      };
    }
    
    const userData = userSnap.data();
    
    // Log raw user data
    console.log('Raw User Data:', userData);

    // Check for past subscriptions (if currently unsubscribed)
    let hadPreviousSubscription = false;
    
    if (!userData.subscribed) {
      // Query for any past subscriptions
      const subsQuery = query(
        collection(db, "subscriptions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      
      const subsSnapshot = await getDocs(subsQuery);
      
      if (!subsSnapshot.empty) {
        // User had a subscription before
        hadPreviousSubscription = true;
      }
    }
    
    const result = {
      subscribed: !!userData.subscribed,
      onTrial: !!userData.onTrial,
      trialEndDate: userData.trialEndDate,
      hadPreviousSubscription: hadPreviousSubscription || !!userData.hadPreviousSubscription
    };

    console.log('Processed Subscription Result:', result);

    return result;
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