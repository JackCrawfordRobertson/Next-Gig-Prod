"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { signOut } from "next-auth/react";

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
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleSignOut = async () => {
    this.setState({ isSigningOut: true });
    try {
      // Only use NextAuth signOut
      await signOut({ 
        callbackUrl: "/login?signedOut=true"
      });
    } catch (error) {
      console.error("Error signing out:", error);
      // Force redirect if sign out fails
      window.location.href = "/login";
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

function ErrorFallback({ error, errorInfo, onReset, onSignOut, isSigningOut }) {
  const [isAuthError, setIsAuthError] = useState(false);
  
  useEffect(() => {
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
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-red-600">
            {isAuthError ? "Authentication Error" : "Something went wrong"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {isAuthError 
              ? "There was a problem with your session. Please log in again."
              : "We're sorry, but something unexpected happened."
            }
          </p>
          
          {process.env.NODE_ENV !== 'production' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-600">
                Error details (dev only)
              </summary>
              <div className="text-xs text-red-500 overflow-auto max-h-40 p-2 bg-gray-100 rounded mt-2">
                <p>{error?.toString()}</p>
                <pre>{errorInfo?.componentStack}</pre>
              </div>
            </details>
          )}
        </CardContent>
        <CardFooter>
          {isAuthError ? (
            <Button 
              onClick={onSignOut} 
              disabled={isSigningOut}
              className="w-full"
            >
              {isSigningOut ? "Signing out..." : "Sign out and log in again"}
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={onReset} className="flex-1">
                Try again
              </Button>
              <Button onClick={() => window.location.href = "/"} className="flex-1">
                Go home
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default ErrorBoundary;