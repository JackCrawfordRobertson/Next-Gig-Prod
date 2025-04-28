// app/api/user/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getServerSession } from "next-auth";
import mockUsers from "@/app/mock/users";
import { mockSession } from "@/app/mock/auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isDevelopmentMode } from "@/lib/environment";

export async function GET(req) {
  // Get the URL hostname for logging purposes
  const url = new URL(req.url);
  const hostname = url.hostname;
  
  // Use the centralized environment detection
  const isDevEnvironment = isDevelopmentMode();
  
  console.log("API User Route - Environment Check:", {
    NODE_ENV: process.env.NODE_ENV,
    hostname: hostname,
    isDevelopmentMode: isDevEnvironment,
    isUsingMockData: isDevEnvironment
  });
  
  // Use mock data based on the centralized environment detection
  if (isDevEnvironment) {
    console.log("API User Route - Using MOCK data");
    const userId = mockSession.user.id;
    const userData = mockUsers[userId];
    
    // Transform the data to match new structure
    const mockUserJobs = [];
    
    if (userData.jobs) {
      // For each job source (linkedin, ifyoucould, etc.)
      Object.entries(userData.jobs).forEach(([source, jobsList]) => {
        // For each job in the source
        jobsList.forEach(job => {
          mockUserJobs.push({
            ...job,
            source,
            id: job.id || `${source}-${Math.random().toString(36).substring(2, 9)}`,
          });
        });
      });
    }
    
    // Instead of returning the userData directly, attach the transformed jobs
    return new Response(
      JSON.stringify({
        ...userData,
        jobsCollection: mockUserJobs
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Production code - always use real data in production mode
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log("API User Route - No session found");
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Log production mode session details for debugging
    console.log("API User Route - PRODUCTION Mode", {
      userEmail: session.user.email,
      userId: session.user.id,
      timestamp: new Date().toISOString()
    });
    
    const userId = session.user.id;
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn(`No user document found for ID: ${userId}`);
      return new Response(
        JSON.stringify({ error: "User data not found" }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify(userDoc.data() || {}), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("API User Route - Error:", error);
    return new Response(
      JSON.stringify({ error: "Server error", message: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}