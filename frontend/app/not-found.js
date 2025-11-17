// app/not-found.js
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 text-6xl">
            404
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Page Not Found
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </CardHeader>

        <CardContent>
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