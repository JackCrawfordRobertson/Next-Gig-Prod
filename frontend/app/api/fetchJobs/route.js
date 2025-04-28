// app/api/fetchJobs/route.js
import { db } from "@/lib/firebase";
import { doc as firestoreDoc, getDoc as firestoreGetDoc } from "firebase/firestore";
import { exec } from "child_process";
import { getServerSession } from "next-auth";
import { mockSession } from "@/app/mock/auth";
import mockUsers from "@/app/mock/users";
import { isDevelopmentMode } from "@/lib/environment";


export async function POST(req) {
  // Use mock data in development
  if (isDevelopmentMode()) {
    const userId = mockSession.user.id;
    const userData = mockUsers[userId];
    
    if (!userData || !userData.jobTitles || userData.jobTitles.length === 0) {
      return new Response("No job preferences set (dev mode)", { status: 400 });
    }
    
    // Simulate scraper success without running Python
    console.log("Mock scraper executed for:", userData.jobTitles);
    return new Response("Scraper executed successfully (dev mode)", { status: 200 });
  }
  
  // Production code
  const session = await getServerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  
  const userId = session.user.id;
  const userRef = firestoreDoc(db, "users", userId);
  
  // Get user preferences
  const userDoc = await firestoreGetDoc(userRef);
  const userData = userDoc.data();
  
  if (!userData || !userData.jobTitles || userData.jobTitles.length === 0) {
    return new Response("No job preferences set", { status: 400 });
  }
  
  // Run Python scraper with job titles & location
  return new Promise((resolve) => {
    exec(
      `python backend/main.py '${userId}'`,
      async (err, stdout) => {
        if (err) return resolve(new Response("Scraper failed", { status: 500 }));
        resolve(new Response("Scraper executed successfully", { status: 200 }));
      }
    );
  });
}