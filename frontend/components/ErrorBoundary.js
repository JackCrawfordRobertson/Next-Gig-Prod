"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { signOut } from "next-auth/react";
import { signOut as firebaseSignOut } from "@/lib/firebase";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      isSigningOut: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Error caught by boundary:", error, errorInfo);
    
    // Optionally log to your error tracking service
    // Example: Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleSignOut = async () => {
    this.setState({ isSigningOut: true });
    try {
      // Sign out from Firebase first
      try {
        await firebaseSignOut();
        console.log("Successfully signed out of Firebase");
      } catch (firebaseError) {
        console.warn("Firebase sign out error:", firebaseError);
        // Continue with NextAuth sign out even if Firebase fails
      }
      
      // Then sign out from NextAuth
      await signOut({ 
        redirect: false // Don't redirect automatically
      });
      
      console.log("Successfully signed out of NextAuth");
      
      // Clear any stored data
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach(c => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      // Manual redirect
      window.location.href = "/login?signedOut=true";
    } catch (error) {
      console.error("Error signing out:", error);
      window.location.href = "/login"; // Fallback redirect
    }
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        onReset={this.handleReset}
        onSignOut={this.handleSignOut}
        isSigningOut={this.state.isSigningOut}
      />;
    }

    return this.props.children;
  }
}

// This allows us to use hooks in our fallback component
function ErrorFallback({ error, errorInfo, onReset, onSignOut, isSigningOut }) {
  const [isAuthError, setIsAuthError] = useState(false);
  
  useEffect(() => {
    // Detect if it's an authentication error
    const errorMessage = error?.message || '';
    const errorString = errorInfo?.componentStack || '';
    
    if (
      errorMessage.includes('auth') || 
      errorMessage.includes('session') ||
      errorString.includes('AuthProvider') ||
      errorString.includes('SessionProvider')
    ) {
      setIsAuthError(true);
    }
  }, [error, errorInfo]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-xl text-red-600">
            {isAuthError ? "Authentication Error" : "Something went wrong"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {isAuthError 
              ? "There was a problem with your session. Please log in again."
              : "We're sorry, but something went wrong. Our team has been notified."
            }
          </p>
          
          {process.env.NODE_ENV !== 'production' && (
            <div className="text-xs text-red-500 overflow-auto max-h-40 p-2 bg-gray-100 rounded">
              <p>{error?.toString()}</p>
              <pre>{errorInfo?.componentStack}</pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {isAuthError ? (
            <Button 
              onClick={onSignOut} 
              disabled={isSigningOut}
              className="w-full"
            >
              {isSigningOut ? "Signing out..." : "Sign out and log in again"}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onReset}>
                Try again
              </Button>
              <Button onClick={() => window.location.href = "/"}>
                Go to home page
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

// Fix for "React is not defined" error
import React from "react";
export default ErrorBoundary;