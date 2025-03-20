// app/api/debug-paypal/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Security check - only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ 
        error: "This endpoint is only available in development mode"
      }, { status: 403 });
    }
    
    // Get environment information
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const planId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID;
    const secret = process.env.PAYPAL_SECRET || process.env.NEXT_PUBLIC_PAYPAL_SECRET;
    const environment = process.env.PAYPAL_ENVIRONMENT || "sandbox";
    const apiUrl = environment === "production" 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";
    
    // Get access token from PayPal
    const authResponse = await fetch(`${apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();
    
    if (!authResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: "Authentication failed",
        details: authData,
        config: {
          environment,
          clientIdExists: !!clientId,
          secretExists: !!secret,
          planIdExists: !!planId,
        }
      });
    }
    
    // List all plans to see what's available
    const plansResponse = await fetch(`${apiUrl}/v1/billing/plans?page_size=20&page=1&total_required=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`
      }
    });
    
    const plansData = await plansResponse.json();
    
    // Try to get the specific plan
    let specificPlanData = null;
    let specificPlanError = null;
    
    if (planId) {
      try {
        const specificPlanResponse = await fetch(`${apiUrl}/v1/billing/plans/${planId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.access_token}`
          }
        });
        
        if (specificPlanResponse.ok) {
          specificPlanData = await specificPlanResponse.json();
        } else {
          specificPlanError = await specificPlanResponse.json();
        }
      } catch (err) {
        specificPlanError = err.message;
      }
    }
    
    return NextResponse.json({
      success: true,
      config: {
        environment,
        apiUrl,
        clientIdExists: !!clientId,
        secretExists: !!secret,
        planId: planId || "NOT SET",
      },
      plans: plansData,
      specificPlan: specificPlanData,
      specificPlanError
    });
    
  } catch (error) {
    console.error("Error in PayPal debug endpoint:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}