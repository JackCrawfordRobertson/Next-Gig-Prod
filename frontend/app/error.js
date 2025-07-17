// app/error.js
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Coffee } from "lucide-react";
import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-pink-100">
      <Card className="max-w-2xl w-full text-center shadow-xl">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-6 text-8xl">🤖💥</div>
          <CardTitle className="text-4xl font-bold text-gray-800 mb-2">
            Oops! Something Went Wrong
          </CardTitle>
          <p className="text-xl text-gray-600">
            Our code just had a career crisis...
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Error Status:</span>
              <span>Currently having an existential crisis</span>
            </div>
          </div>
          
          <div className="space-y-3 text-gray-600">
            <p className="flex items-center justify-center space-x-2">
              <Coffee className="h-4 w-4" />
              <span>The server is taking an unscheduled coffee break</span>
            </p>
            <p>🔧 Our developers are frantically googling "how to fix this"</p>
            <p>⏰ Estimated fix time: When we figure out what broke</p>
            <p>🎭 Current mood: Debugging in production (again)</p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Here's what you can try:
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={reset}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </Button>
              
              <Button 
                onClick={() => window.location.href = "/"}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Go Home</span>
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p className="italic">
              "It's not a bug, it's an undocumented feature!" 
            </p>
            <p className="text-xs">
              Error ID: {Math.random().toString(36).substring(2, 15).toUpperCase()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}