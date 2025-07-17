// app/not-found.js
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Home, Search, ArrowLeft, Coffee, MapPin } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="max-w-2xl w-full text-center shadow-xl">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-6 text-8xl">🕵️‍♂️</div>
          <CardTitle className="text-4xl font-bold text-gray-800 mb-2">
            404 - Job Not Found!
          </CardTitle>
          <p className="text-xl text-gray-600">
            Looks like this page went to find a better opportunity elsewhere...
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-yellow-800">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">Last seen:</span>
              <span>Somewhere in the digital void</span>
            </div>
          </div>
          
          <div className="space-y-3 text-gray-600">
            <p className="flex items-center justify-center space-x-2">
              <Coffee className="h-4 w-4" />
              <span>This page is probably networking at a coffee shop right now</span>
            </p>
            <p>📝 Status: Currently updating its CV</p>
            <p>💼 Experience: 0 years (because it doesn't exist)</p>
            <p>🎯 Salary expectations: 404 errors per hour</p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Don't worry, we've got plenty of other opportunities:
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => router.back()} 
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </Button>
              
              <Button 
                onClick={() => router.push("/")}
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Home Sweet Home</span>
              </Button>
              
              <Button 
                onClick={() => router.push("/jobs")}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Find Real Jobs</span>
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-500 italic">
            "The best error pages are the ones you never see" - Anonymous Developer
          </div>
        </CardContent>
      </Card>
    </div>
  );
}