"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { doc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getFingerprint, checkForFraudPatterns } from "@/lib/fingerprint";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { isUserTester } from "@/lib/subscription";
import { isDevelopmentMode } from "@/lib/environment";
import PayPalButton from "@/components/PayPalButton";
import { showToast } from "@/lib/toast";  // Use your existing toast function

// Test user for development mode
const MOCK_USER = {
    user: {
      id: "OS6veyhaPARd9KeCnXU11re06Dq2", // Match this with the ID in mockUsers
      email: "jack@ya-ya.co.uk",
    },
  };

function SubscriptionComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } =
        process.env.NODE_ENV === "development"
            ? { data: MOCK_USER, status: "authenticated" }
            : useSession();

    const [clientReady, setClientReady] = useState(false);
    const [fingerprint, setFingerprint] = useState(null);
    const [fraudCheck, setFraudCheck] = useState({ status: "pending", isSuspicious: false });
    const [errorMessage, setErrorMessage] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);
    const [userId, setUserId] = useState(null);

    // Check URL parameters on mount
    useEffect(() => {
        // Check if this is a new user flow
        const isNew = searchParams.get("new") === "true";
        setIsNewUser(isNew);
        
        // Get userId from URL or session
        const urlUserId = searchParams.get("userId");
        if (urlUserId) {
            setUserId(urlUserId);
            console.log("Using userId from URL:", urlUserId);
        } else if (session?.user?.id) {
            setUserId(session.user.id);
            console.log("Using userId from session:", session.user.id);
        }
    }, [searchParams, session]);

    useEffect(() => {
        // Check for pending user ID in localStorage (for dev mode)
        const pendingUserId = localStorage.getItem('pendingUserId');
        if (pendingUserId && !userId) {
          setUserId(pendingUserId);
          localStorage.removeItem('pendingUserId'); // Clear after use
        }
      }, [userId]);
    
    useEffect(() => {
        // Only redirect to login if:
        // 1. We're not in a loading state AND
        // 2. There's no userId or the user is unauthenticated AND
        // 3. This is NOT a new user coming from account creation
        if (
          status !== "loading" && 
          ((!userId && status === "unauthenticated") || 
           (status === "unauthenticated" && !isNewUser))
        ) {
          console.log("No authenticated user and not a new registration - redirecting to login");
          router.push("/login");
        } else if (isNewUser && userId) {
          // For new users with a userId, we'll allow them to continue to the subscription page
          // even if they don't have a full session yet
          console.log("New user registration flow detected - allowing access to subscription page");
        }
      }, [userId, status, router, isNewUser]);

    useEffect(() => {
        const isDev = isDevelopmentMode();
        
        if (isDev && isNewUser && userId) {
            console.log("Development mode: Simulating subscription for new user");
            // Show success message
            try {
                showToast({
                    title: "Dev Mode",
                    description: "Subscription simulated successfully for new user.",
                    variant: "success",
                });
                
                // Redirect to dashboard after delay
                setTimeout(() => router.push("/dashboard"), 2000);
            } catch (error) {
                console.error("Error showing toast:", error);
            }
        }
    }, [isNewUser, userId, router]);

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
                if (userId && fp) {
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
    }, [userId]);

    useEffect(() => {
        async function checkTesterStatus() {
          if (session?.user?.email) {
            try {
              const isTester = await isUserTester(session.user.email);
              
              if (isTester) {
                console.log("User is a tester - redirecting to dashboard");
                // Show a quick toast message
                showToast({
                  title: "Tester Account Detected",
                  description: "You have been granted full access as a tester",
                  variant: "success",
                });
                
                // Redirect to dashboard
                router.push("/dashboard");
              }
            } catch (error) {
              console.error("Error checking tester status:", error);
            }
          }
        }
        
        if (session?.user?.email) {
          checkTesterStatus();
        }
    }, [session, router]);

    // Log session data when it changes
    useEffect(() => {
        console.log("Session data:", session);
    }, [session]);

    // If no user ID is available, redirect to login
    useEffect(() => {
        if ((!userId && status !== "loading") || status === "unauthenticated") {
            if (!isNewUser) {
                router.push("/login");
            }
        }
    }, [userId, status, router, isNewUser]);

    if (!clientReady || status === "loading") {
        return <div className="flex items-center justify-center h-screen text-lg">Loading...</div>;
    }

    const handleSubscriptionSuccess = async (subscriptionData) => {
        try {
            console.log("Subscription successful, data:", subscriptionData);
            console.log("Storing subscription for user ID:", userId);
            
            // Use existing storeSubscription function
            const { storeSubscription } = await import("@/lib/checkSubscriptionStatus");
            
            const result = await storeSubscription(
                userId,
                subscriptionData,
                fingerprint,
                { showToast: true }
            );
            
            console.log("Subscription stored successfully:", result);
            
            // Redirect to dashboard
            router.push("/dashboard");
        } catch (error) {
            console.error("Subscription error:", error);
            setErrorMessage(
                "Subscription update failed. Please try again or contact support."
            );
            
            showToast({
                title: "Subscription Error",
                description: "There was a problem setting up your subscription. Please try again.",
                variant: "destructive",
            });
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
                            style={{ height: "auto" }}
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

                    {/* Responsive Layout: Two column on desktop, stacked & centered on mobile */}
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
                    {userId ? (
                        <div className="w-full">
                            {/* Add special message for new users */}
                            {isNewUser && (
                                <div className="mb-4 text-center">
                                    <p className="text-green-600 font-medium">
                                        Your account has been created successfully!
                                    </p>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Complete your subscription to start receiving job alerts.
                                    </p>
                                </div>
                            )}
                            
                            {fraudCheck.isSuspicious ? (
                                <Button className="w-full" variant="outline" disabled>
                                    Subscription Unavailable
                                </Button>
                            ) : (
                                <PayPalButton 
                                    userId={userId} 
                                    onSuccess={handleSubscriptionSuccess} 
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

// Dynamically import the page to force client-side rendering
const SubscriptionPage = dynamic(() => Promise.resolve(SubscriptionComponent), { ssr: false });

export default SubscriptionPage;