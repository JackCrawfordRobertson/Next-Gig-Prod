// app/global-error.js
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-100">
          <Card className="max-w-2xl w-full text-center shadow-xl">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-6 text-8xl">🔥💻</div>
              <CardTitle className="text-4xl font-bold text-gray-800 mb-2">
                EVERYTHING IS ON FIRE! 🔥
              </CardTitle>
              <p className="text-xl text-gray-600">
                The entire application just rage-quit...
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-purple-800 font-medium">
                  Critical System Failure Detected
                </div>
                <div className="text-sm text-purple-600 mt-1">
                  Even our error handling has errors
                </div>
              </div>
              
              <div className="space-y-3 text-gray-600">
                <p>🚨 Severity Level: "Oh no, oh no, oh no no no no no"</p>
                <p>📱 Please contact support (they're probably crying too)</p>
                <p>☕ Developers currently stress-eating cookies</p>
                <p>🔧 Status: Percussive maintenance in progress</p>
              </div>

              <div className="border-t pt-6">
                <Button 
                  onClick={reset}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Attempt Resurrection 🧟‍♂️
                </Button>
              </div>

              <div className="text-sm text-gray-500 italic">
                "Have you tried turning it off and on again?" - The IT Crowd
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}