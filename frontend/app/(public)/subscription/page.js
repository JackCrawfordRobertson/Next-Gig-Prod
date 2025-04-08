"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { checkSubscriptionStatus, showSubscriptionToast } from "@/lib/checkSubscriptionStatus";
import { storeSubscription } from "@/lib/checkSubscriptionStatus";

import Image from "next/image";
import { doc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getFingerprint, checkForFraudPatterns } from "@/lib/fingerprint";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Import PayPalButton dynamically to prevent SSR hydration issues
const PayPalButton = dynamic(() => import("@/components/PayPalButton"), { ssr: false });

// Test user for development mode
const MOCK_USER = {
    user: {
        id: "test-user-123",
        email: "testuser@example.com",
    },
};

// Dynamically import the page to force client-side rendering
const SubscriptionPage = dynamic(() => Promise.resolve(SubscriptionComponent), { ssr: false });

function SubscriptionComponent() {
    const router = useRouter();
    const { data: session, status } =
        process.env.NODE_ENV === "development"
            ? { data: MOCK_USER, status: "authenticated" }
            : useSession();

    const [clientReady, setClientReady] = useState(false);
    const [fingerprint, setFingerprint] = useState(null);
    const [fraudCheck, setFraudCheck] = useState({ status: "pending", isSuspicious: false });
    const [errorMessage, setErrorMessage] = useState("");

    // Initialize the component and generate fingerprint
    useEffect(() => {
        console.log("Rendering SubscriptionPage...");
        setClientReady(true);

        // Generate fingerprint on component mount
        const initFingerprint = async () => {
            try {
                const fp = await getFingerprint();
                setFingerprint(fp);
                console.log("Fingerprint generated:", fp);
                
                // If user is authenticated, check for fraud patterns
                if (session?.user?.id && fp) {
                    const fraudResult = await checkForFraudPatterns(db, fp);
                    setFraudCheck({
                        status: "completed",
                        isSuspicious: fraudResult.isSuspicious,
                        data: fraudResult.existingSubscriptions,
                    });
                    
                    if (fraudResult.isSuspicious) {
                        console.warn("Suspicious activity detected:", fraudResult);
                        setErrorMessage("We've detected that you may already have an active subscription. If you believe this is an error, please contact support.");
                    }
                }
            } catch (err) {
                console.error("Error during fingerprint generation:", err);
                setFraudCheck({ status: "error", error: err.message });
            }
        };

        initFingerprint();
    }, [session]);

    // Log session data when it changes
    useEffect(() => {
        console.log("Session data:", session);
    }, [session]);

    if (!clientReady || status === "loading") {
        return <div className="flex items-center justify-center h-screen text-lg">Loading...</div>;
    }

   const handlePayPallSubscriptionSuccess = async (subscriptionData) => {
    try {
      console.log("Subscription successful:", subscriptionData);

      // Calculate trial end date (7 days from now)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      // 1) Update user document
      await updateDoc(doc(db, "users", session.user.id), {
        subscribed: true,
        onTrial: true,
        subscriptionPlan: "paypal",
        subscriptionId: subscriptionData.subscriptionId,
        subscriptionStartDate: new Date().toISOString(),
        trialEndDate: trialEndDate.toISOString(),
      });

      // 2) Create subscription record in "subscriptions" collection
      await addDoc(collection(db, "subscriptions"), {
        userId: session.user.id,
        subscriptionId: subscriptionData.subscriptionId,
        plan: "paypal",
        status: "trial",
        startDate: new Date().toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        fingerprint: fingerprint,
        paymentMethod: "paypal",
        price: 2.99,
        currency: "GBP",
        createdAt: new Date().toISOString(),
      });

      // Finally, redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Error updating subscription:", err);
      setErrorMessage(
        "Subscription update failed. Please try again or contact support."
      );
    }
  };

    return (
        <div className="min-h-screen w-full bg-transparent flex flex-col items-center justify-center py-6 px-4">
            <Card className="max-w-2xl w-full shadow-lg border border-gray-200">
               
                  <CardHeader className="flex flex-col items-center text-center">
                                   <div className="mb-4">
                                       <Image 
                                           src="/nextgig-logo.svg" 
                                           alt="Company Logo" 
                                           width={140} 
                                           height={50} 
                                           priority
                                       />
                                   </div>
                                   <p className="text-lg font-medium text-gray-700 mt-2">
                                   Support What Matters
                                                                      </p>
                               </CardHeader>

                <CardContent className="space-y-6">
                    <p className="text-center text-gray-600 text-lg">
                        The price of keeping the lights on. The cost of getting jobs straight to your inbox.
                    </p>

                    <Separator />

                    {/* Display error message if fraud is detected */}
                    {errorMessage && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTitle>Subscription Error</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}

                    {/* Responsive Layout: Two-column on desktop, stacked & centered on mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        
                        {/* Left Column: Text Content (Centered on Mobile) */}
                        <div className="text-center md:text-left space-y-4">
                            <h2 className="text-2xl font-semibold">One Simple Plan</h2>
                            <p className="text-gray-700">No gimmicks. No fluff. Just jobs.</p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                <li>Personalised job alerts</li>
                                <li>Direct to your inbox</li>
                                <li>Support the platform</li>
                            </ul>

                            {/* Price and CTA */}
                            <div className="flex justify-center md:justify-start items-baseline space-x-2">
                                <h1 className="text-3xl font-bold">£2.99</h1>
                                <p className="text-gray-500">/ month</p>
                            </div>
                        </div>

                        {/* Right Column: PayPal Logo (Hidden on Mobile) */}
                        <div className="hidden md:flex justify-center items-center h-full w-full">
                            <img src="/paypall.png" alt="Pay with PayPal" className="w-36" />
                        </div>
                    </div>

                    <p className="text-center text-gray-600 text-sm mt-2">
                        <strong>7 days free.</strong> Cancel anytime.<br />
                        But why would you? Let the 7 days show you.
                    </p>

                    <Separator />
                </CardContent>

                <CardFooter className="flex flex-col items-center space-y-4 w-full">
                    {session?.user?.id ? (
                        <div className="w-full">
                            {fraudCheck.isSuspicious ? (
                                <Button className="w-full" variant="outline" disabled>
                                    Subscription Unavailable
                                </Button>
                            ) : (
                                <PayPalButton 
                                    userId={session.user.id} 
                                    onSuccess={handlePayPallSubscriptionSuccess} 
                                />
                            )}
                        </div>
                    ) : (
                        <div className="text-center w-full">
                            <p className="text-gray-600 mb-4">Please log in to subscribe.</p>
                            <Button className="w-full" onClick={() => router.push("/login")}>
                                Go to Login
                            </Button>
                        </div>
                    )}

                    <p className="text-center text-gray-500 text-sm">
                        By subscribing, you agree to our
                        <a href="/terms" className="underline mx-1">Terms of Service</a>
                        and
                        <a href="/privacy" className="underline mx-1">Privacy Policy</a>.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default SubscriptionPage;