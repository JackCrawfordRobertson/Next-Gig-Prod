// components/PayPalButton.jsx
"use client";

import { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const PayPalButton = ({ userId, onSuccess }) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const [planInfo, setPlanInfo] = useState(null);
  
  // Get environment information
  const environment = process.env.NODE_ENV;
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const planId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID;

  // PayPal configuration for subscriptions with trial
  const paypalOptions = {
    "client-id": clientId,
    intent: "subscription",
    vault: true,
    components: "buttons",
    currency: "GBP",
  };

  // Fetch plan info in development mode for easier debugging
  useEffect(() => {
    setError(null);
    
    // Log configuration details
    console.log(`PayPal Button - Environment: ${environment}`);
    console.log(`PayPal Button - Client ID set: ${!!clientId}`);
    console.log(`PayPal Button - Plan ID: ${planId || "NOT SET"}`);
    
    if (environment === "development") {
      setDevMode(true);
      
      if (planId) {
        fetch('/api/test-paypal-plan')
          .then(res => res.json())
          .then(data => {
            setPlanInfo(data);
            
            // Check if the plan exists in the available plans list
            const planExists = data.specificPlan !== null && !data.specificPlanError;
            
            if (!planExists) {
              console.error("PayPal Button - Plan ID not found in your PayPal account");
              console.error("Available plans:", data.plans?.plans || "None");
              
              setError("The subscription plan ID is invalid or not accessible in this environment");
            }
          })
          .catch(err => {
            console.error("PayPal Button - Failed to fetch plan info:", err);
          });
      }
    }
    
    setIsLoading(false);
  }, [environment, clientId, planId]);

  const handleCreateSubscription = (data, actions) => {
    console.log("PayPal Button - Creating subscription with plan ID:", planId);
    
    if (!planId) {
      console.error("PayPal Button - Plan ID is not set");
      setError("Configuration error: Missing subscription plan ID");
      throw new Error("Missing plan ID");
    }
    
    return actions.subscription.create({
      plan_id: planId,
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        brand_name: "Next Gig Jobs",
        locale: "en-GB",
      },
      subscriber: {
        name: {
          given_name: "Subscriber",
          surname: "User"
        },
        email_address: "subscriber@example.com"
      },
      custom_id: userId,
    }).catch(err => {
      console.error("PayPal Button - Error creating subscription:");
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      console.error("Error details:", err.details || "No details available");
      
      if (err.name === "RESOURCE_NOT_FOUND") {
        setError(
          "The subscription plan could not be found. This typically means the plan ID " +
          "doesn't exist in this PayPal environment (sandbox vs. production)."
        );
      } else {
        setError(`Failed to set up subscription: ${err.message}`);
      }
      
      throw err;
    });
  };

  // Show PayPal development helper for creating plans
  const showPlanHelper = devMode && (!planId || error);
  
  return (
    <div className="w-full space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
      
      {showPlanHelper && (
        <Alert variant="warning" className="mt-4 bg-amber-50">
          <AlertTitle>Development Helper</AlertTitle>
          <AlertDescription className="text-sm">
            <p className="mb-2">
              {!planId ? "No subscription plan ID is set in your environment variables." : 
               "The current plan ID isn't accessible in this environment."}
            </p>
            
            <p className="mb-2">To create a subscription plan:</p>
            <ol className="list-decimal pl-5 mb-2 space-y-1">
              <li>Go to <a href="https://developer.paypal.com/dashboard/" target="_blank" rel="noopener noreferrer" className="underline">PayPal Developer Dashboard</a></li>
              <li>Navigate to "Products & Plans" in your PayPal Sandbox account</li>
              <li>Create a new product, then create a plan for that product</li>
              <li>Set up the trial period (7 days) and recurring billing (£2.99/month)</li>
              <li>Copy the Plan ID and set it as <code>NEXT_PUBLIC_PAYPAL_PLAN_ID</code> in your <code>.env.local</code> file</li>
            </ol>
            
            {planInfo && planInfo.plans?.plans?.length > 0 && (
              <div className="mt-3">
                <p className="font-medium">Available plans in your account:</p>
                <ul className="list-disc pl-5 text-xs">
                  {planInfo.plans.plans.map((plan, index) => (
                    <li key={index}>
                      {plan.name || 'Unnamed plan'} - ID: <code className="bg-gray-100 px-1">{plan.id}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {!showPlanHelper && (
           <PayPalScriptProvider options={paypalOptions}>
           <PayPalButtons
             style={{
               layout: "vertical",
               color: "blue",
               shape: "rect",
               label: "subscribe",
             }}
             createSubscription={handleCreateSubscription}
             onApprove={(data, actions) => {
               console.log("Subscription approved:", data);
               
               // Calculate trial end date (7 days from now)
               const trialEndDate = new Date();
               trialEndDate.setDate(trialEndDate.getDate() + 7);
               
               // Subscription successful - call onSuccess with normalized data
               // Always use subscriptionId, not subscriptionID
               if (onSuccess && typeof onSuccess === "function") {
                 onSuccess({
                   subscriptionId: data.subscriptionID, // Use consistent naming
                   orderId: data.orderID,
                   startTime: new Date().toISOString(),
                   trialEndDate: trialEndDate.toISOString(),
                 });
               }
               
               return actions.subscription.get().then((details) => {
                 console.log("Subscription details:", details);
               }).catch(err => {
                 console.warn("Could not fetch subscription details:", err);
                 // We still consider this a success since the subscription was created
               });
             }}
             onError={(err) => {
               console.error("PayPal error:", err);
               setError("There was a problem setting up your subscription. Please try again.");
             }}
             onCancel={() => {
               console.log("Subscription canceled");
               setError("Subscription process was canceled. Please try again when you're ready.");
             }}
           />
         </PayPalScriptProvider>
          )}
          
          {/* Development helper button for creating a test plan */}
          {showPlanHelper && (
            <div className="text-center">
              <Button 
                variant="outline"
                className="mt-4"
                onClick={() => window.open("https://developer.paypal.com/dashboard/", "_blank")}
              >
                Go to PayPal Developer Dashboard
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PayPalButton;