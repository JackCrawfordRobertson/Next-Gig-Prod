// lib/subscription-manager.js
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export class SubscriptionManager {
  static async createSubscription(userId, subscriptionData) {
    try {
      console.log("Creating subscription for userId:", userId);
      console.log("Subscription data:", subscriptionData);
      
      // Validate inputs
      if (!userId) {
        throw new Error("User ID is required");
      }
      
      if (!db) {
        throw new Error("Firebase not initialized");
      }
      
      // Validate user exists
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error("User not found");
      }
      
      const userData = userSnap.data();
      
      // Determine trial eligibility
      const trialInfo = await this.calculateTrialEligibility(userId, userData);
      
      // Create subscription document
      const subscriptionId = subscriptionData.subscriptionId || subscriptionData.subscriptionID;
      
      if (!subscriptionId) {
        throw new Error("Subscription ID is required");
      }
      
      // Create subscription document with the subscription ID as the document ID
      const subscriptionRef = doc(db, "subscriptions", subscriptionId);
      
      const subscriptionDoc = {
        userId,
        subscriptionId,
        status: trialInfo.eligible ? 'trial' : 'active',
        plan: 'standard',
        price: 2.99,
        currency: 'GBP',
        paymentMethod: 'paypal',
        startDate: new Date().toISOString(),
        trialEndDate: trialInfo.eligible ? trialInfo.endDate : null,
        trialDuration: trialInfo.duration,
        createdAt: new Date().toISOString(),
        paypalOrderId: subscriptionData.orderId || subscriptionData.orderID,
      };
      
      console.log("Creating subscription document:", subscriptionDoc);
      await setDoc(subscriptionRef, subscriptionDoc);
      
      // Update user document
      const userUpdateData = {
        subscribed: true,
        subscriptionId,
        onTrial: trialInfo.eligible,
        trialEndDate: trialInfo.eligible ? trialInfo.endDate : null,
        hadPreviousSubscription: true,
        lastSubscriptionDate: new Date().toISOString(),
      };
      
      console.log("Updating user document:", userUpdateData);
      await updateDoc(userRef, userUpdateData);
      
      console.log("Subscription created successfully");
      
      return {
        success: true,
        subscriptionId,
        trialInfo
      };
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }
  
  static async calculateTrialEligibility(userId, userData) {
    // Default values
    let eligible = true;
    let duration = 7;
    let reason = "First-time subscriber";
    
    if (userData.hadPreviousSubscription) {
      // Check previous subscriptions
      const subscriptionsRef = collection(db, 'subscriptions');
      const q = query(subscriptionsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // If they had a previous subscription, no trial
        eligible = false;
        duration = 0;
        reason = "Previous subscription detected";
      }
    }
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);
    
    return {
      eligible,
      duration,
      endDate: endDate.toISOString(),
      reason
    };
  }
}