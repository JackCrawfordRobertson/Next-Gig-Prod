// app/error.js
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";
import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full shadow-lg border-destructive/30">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Something Went Wrong
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            We encountered an unexpected error. Please try returning to the home page.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-mono">
              {error?.message || "An unexpected error occurred"}
            </p>
          </div>

          <Button
            onClick={() => window.location.href = "/"}
            className="w-full flex items-center justify-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Return to Home</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}