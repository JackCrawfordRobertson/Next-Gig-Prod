"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { SubscriptionManager } from "@/lib/subscription-manager";
import PayPalButton from "@/components/PayPalButton";
import { showToast } from "@/lib/toast";
// ... other imports

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  
  useEffect(() => {
    // Determine user ID and new user status
    const urlUserId = searchParams.get("userId");
    const urlIsNew = searchParams.get("new") === "true";
    
    if (urlUserId) {
      setUserId(urlUserId);
      setIsNewUser(urlIsNew);
    } else if (session?.user?.id) {
      setUserId(session.user.id);
      setIsNewUser(false);
    } else if (status === "unauthenticated") {
      // Not authenticated and no user ID in URL
      router.push("/login");
    }
    
    setLoading(false);
  }, [session, status, searchParams, router]);
  
  const handleSubscriptionSuccess = async (paypalData) => {
    try {
      setLoading(true);
      
      // Create subscription using the manager
      const result = await SubscriptionManager.createSubscription(userId, {
        subscriptionId: paypalData.subscriptionID,
        orderId: paypalData.orderID,
        startTime: paypalData.startTime,
      });
      
      // Update the session with new subscription data
      await update({
        subscribed: true,
        subscriptionId: result.subscriptionId,
        onTrial: result.trialInfo.eligible,
        trialEndDate: result.trialInfo.endDate,
      });
      
      showToast({
        title: "Subscription Activated!",
        description: result.trialInfo.eligible 
          ? `Your ${result.trialInfo.duration}-day trial has started.`
          : "Your subscription is now active.",
        variant: "success",
      });
      
      // Clear any stored data
      localStorage.removeItem('pendingUserId');
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
      
    } catch (error) {
      console.error("Subscription error:", error);
      showToast({
        title: "Subscription Error",
        description: "Failed to activate subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="mb-4">Please log in to subscribe</p>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Your existing subscription UI */}
      <PayPalButton 
        userId={userId}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
}