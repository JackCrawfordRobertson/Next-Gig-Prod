// app/api/user/route.js
import { db } from "@/lib/data/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getServerSession } from "next-auth";
import mockUsers from "@/app/mock/users";
import { mockSession } from "@/app/mock/auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isDevelopmentMode } from "@/lib/utils/environment";

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
    
    if (!userData) {
      console.warn(`No mock user found for ID: ${userId}`);
      return new Response(
        JSON.stringify({ error: "Mock user not found" }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Transform the data to match new structure
    const transformedJobs = [];
    
    // Define all possible job sources
    const jobSources = ['linkedin', 'ifyoucould', 'unjobs', 'workable', 'ziprecruiter', 'glassdoor'];
    
    // Process each source
    jobSources.forEach(source => {
      if (userData[source] && Array.isArray(userData[source])) {
        userData[source].forEach((job, index) => {
          transformedJobs.push({
            ...job,
            source: source,
            job_id: job.id || `${source}-${index}-${Math.random().toString(36).substring(2, 9)}`,
            id: job.id || `${source}-${index}-${Math.random().toString(36).substring(2, 9)}`,
            added_at: job.date_added || job.date_posted || new Date().toISOString(),
            user_id: userId,
            has_applied: job.has_applied || false,
            is_saved: job.is_saved || false,
            notes: job.notes || "",
            // Ensure all required fields are present
            title: job.title || "Unknown Title",
            company: job.company || "Unknown Company",
            location: job.location || "Unknown Location",
            url: job.url || "#",
            salary: job.salary || "Not Provided",
            description: job.description || "",
            date_posted: job.date_posted || job.date_added || new Date().toISOString()
          });
        });
        
        console.log(`Transformed ${userData[source].length} jobs from ${source}`);
      }
    });
    
    // Also handle legacy jobs structure if it exists
    if (userData.jobs && typeof userData.jobs === 'object') {
      Object.entries(userData.jobs).forEach(([source, jobsList]) => {
        if (Array.isArray(jobsList)) {
          jobsList.forEach((job, index) => {
            transformedJobs.push({
              ...job,
              source: source,
              job_id: job.id || `${source}-legacy-${index}-${Math.random().toString(36).substring(2, 9)}`,
              id: job.id || `${source}-legacy-${index}-${Math.random().toString(36).substring(2, 9)}`,
              added_at: job.date_added || job.date_posted || new Date().toISOString(),
              user_id: userId,
              has_applied: job.has_applied || false,
              is_saved: job.is_saved || false,
              notes: job.notes || "",
              title: job.title || "Unknown Title",
              company: job.company || "Unknown Company",
              location: job.location || "Unknown Location",
              url: job.url || "#",
              salary: job.salary || "Not Provided",
              description: job.description || "",
              date_posted: job.date_posted || job.date_added || new Date().toISOString()
            });
          });
          
          console.log(`Transformed ${jobsList.length} jobs from legacy ${source}`);
        }
      });
    }
    
    console.log(`Total transformed jobs: ${transformedJobs.length}`);
    
    // Return userData with transformed jobs
    return new Response(
      JSON.stringify({
        ...userData,
        transformedJobs: transformedJobs,
        // Keep original source arrays for backward compatibility
        jobsCollection: transformedJobs // Alternative name for consistency
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