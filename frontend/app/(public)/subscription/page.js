// app/(public)/subscription/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { SubscriptionManager } from "@/lib/subscriptions/subscription-manager";
import PayPalButton from "@/components/subscription/PayPalButton";
import { showToast } from "@/lib/utils/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Zap, Mail, Shield } from "lucide-react";

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const urlUserId = searchParams.get("userId");
    const urlIsNew = searchParams.get("new") === "true";

    if (urlUserId) {
      setUserId(urlUserId);
      setIsNewUser(urlIsNew);
    } else if (session?.user?.id) {
      setUserId(session.user.id);
      setIsNewUser(false);
    } else if (status === "unauthenticated") {
      router.push("/login");
    }

    setLoading(false);
  }, [session, status, searchParams, router]);

  // In your subscription page, update the handleSubscriptionSuccess function:
const handleSubscriptionSuccess = async (paypalData) => {
  try {
    setProcessingPayment(true);
    
    console.log("PayPal data received:", paypalData);
    
    // Ensure we have the correct subscription ID format
    const subscriptionId = paypalData.subscriptionID || paypalData.subscriptionId;
    
    if (!subscriptionId) {
      throw new Error("No subscription ID received from PayPal");
    }
    
    const result = await SubscriptionManager.createSubscription(userId, {
      subscriptionId: subscriptionId,
      orderId: paypalData.orderID || paypalData.orderId,
      startTime: paypalData.startTime || new Date().toISOString(),
    });
    
    console.log("Subscription created:", result);
    
    // Update the session
    if (update) {
      await update({
        subscribed: true,
        subscriptionId: result.subscriptionId,
        onTrial: result.trialInfo.eligible,
        trialEndDate: result.trialInfo.endDate,
      });
    }
    
    showToast({
      title: "Welcome to Next Gig! 🎉",
      description: result.trialInfo.eligible
        ? `Your ${result.trialInfo.duration}-day free trial has started.`
        : "Your subscription is now active.",
      variant: "success",
    });
    
    localStorage.removeItem("pendingUserId");
    
    // Redirect to dashboard
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
    
  } catch (error) {
    console.error("Subscription error:", error);
    showToast({
      title: "Subscription Error",
      description: error.message || "Failed to activate subscription. Please try again.",
      variant: "destructive",
    });
  } finally {
    setProcessingPayment(false);
  }
};

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Loading subscription options...
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="mb-4">Please log in to subscribe</p>
              <Button onClick={() => router.push("/login")}>Go to Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* Features Card */}
          <Card className="shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl md:text-2xl">What You Get</CardTitle>
              <CardDescription className="text-sm">
                Everything you need to land your next dream job
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-1.5 md:p-2 flex-shrink-0">
                  <Check className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">Daily Job Alerts</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Fresh opportunities delivered straight to your inbox
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-1.5 md:p-2 flex-shrink-0">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">Smart Matching</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    AI-powered job recommendations based on your preferences
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-purple-100 p-1.5 md:p-2 flex-shrink-0">
                  <Zap className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">Multiple Sources</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Jobs from LinkedIn, UN Jobs, If You Could, and more
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-orange-100 p-1.5 md:p-2 flex-shrink-0">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">Application Tracking</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Keep track of where you've applied
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Card */}
          <Card className="shadow-xl border-primary/20 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl md:text-2xl">Start Your Journey</CardTitle>
              <div className="mt-3 md:mt-4">
                <span className="text-3xl md:text-4xl font-bold">£2.99</span>
                <span className="text-muted-foreground text-sm md:text-base">/month</span>
              </div>
              <CardDescription className="mt-2 text-sm">
                Cancel anytime • No hidden fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {/* Trial Badge */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 text-center">
                <p className="text-green-800 font-semibold text-sm md:text-base">
                  🎁 Start with a 7-day FREE trial
                </p>
                <p className="text-green-700 text-xs md:text-sm mt-1">
                  No payment required during trial
                </p>
              </div>

              {/* PayPal Button */}
              <div className="relative">
                {processingPayment && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Processing...
                      </p>
                    </div>
                  </div>
                )}
                <PayPalButton
                  userId={userId}
                  onSuccess={handleSubscriptionSuccess}
                />
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-3 md:gap-4 pt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  Secure Payment
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3" />
                  Instant Access
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ or Additional Info - Hidden on mobile for cleaner look */}
        <div className="hidden md:block mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Questions? Email us at{" "}
            <a
              href="mailto:jack@ya-ya.co.uk"
              className="text-black hover:underline"
            >
              support@next-gig.co.uk
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}