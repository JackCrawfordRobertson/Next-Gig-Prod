import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getSession } from "next-auth/react";

export class SubscriptionManager {
  static async createSubscription(userId, subscriptionData) {
    try {
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
        paypalOrderId: subscriptionData.orderId,
      };
      
      await setDoc(subscriptionRef, subscriptionDoc);
      
      // Update user document
      await updateDoc(userRef, {
        subscribed: true,
        subscriptionId,
        onTrial: trialInfo.eligible,
        trialEndDate: trialInfo.eligible ? trialInfo.endDate : null,
        hadPreviousSubscription: true,
        lastSubscriptionDate: new Date().toISOString(),
      });
      
      // Update NextAuth session
      await this.updateSession(userId, {
        subscribed: true,
        subscriptionId,
        onTrial: trialInfo.eligible,
        trialEndDate: trialInfo.eligible ? trialInfo.endDate : null,
      });
      
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
    // Your existing trial calculation logic
    let eligible = true;
    let duration = 7;
    let reason = "First-time subscriber";
    
    if (userData.hadPreviousSubscription) {
      // Check previous subscriptions
      const subscriptionsRef = collection(db, 'subscriptions');
      const q = query(subscriptionsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      // Logic to determine remaining trial days
      // ... (your existing logic)
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
  
  static async updateSession(userId, updates) {
    // This will trigger the session update in NextAuth
    if (typeof window !== 'undefined') {
      const { update } = await import("next-auth/react");
      await update(updates);
    }
  }
}