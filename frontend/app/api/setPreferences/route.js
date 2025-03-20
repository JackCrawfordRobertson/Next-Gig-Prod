// app/api/setPreferences/route.js
import { db } from "@/lib/firebase";
import { doc as firestoreDoc, setDoc as firestoreSetDoc } from "firebase/firestore";
import { getServerSession } from "next-auth";
import { mockSession } from "@/app/mock/auth";
import mockUsers from "@/app/mock/users";

export async function POST(req) {
  // Use mock data in development
  if (process.env.NODE_ENV === "development") {
    const userId = mockSession.user.id;
    const { jobTitles, location } = await req.json();
    
    // Update the mock data
    mockUsers[userId] = {
      ...mockUsers[userId],
      jobTitles,
      location
    };
    
    console.log("Mock preferences updated:", { jobTitles, location });
    return new Response("Preferences updated (dev mode)", { status: 200 });
  }
  
  // Production code
  const session = await getServerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  
  const { jobTitles, location } = await req.json();
  
  await firestoreSetDoc(firestoreDoc(db, "users", session.user.id), {
    jobTitles,
    location,
  }, { merge: true });
  
  return new Response("Preferences updated", { status: 200 });
}