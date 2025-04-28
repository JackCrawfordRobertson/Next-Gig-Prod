// app/api/getJobs/route.js
import { db } from "@/lib/firebase";
import { doc as firestoreDoc, getDoc as firestoreGetDoc } from "firebase/firestore";
import { getServerSession } from "next-auth";
import { mockSession } from "@/app/mock/auth";
import mockUsers from "@/app/mock/users";
import { isDevelopmentMode } from "@/lib/environment";


export async function GET(req) {
  // Use mock data in development
  if (isDevelopmentMode()) {
    const userId = mockSession.user.id;
    const userData = mockUsers[userId];
    
    // Either return the jobs array or an empty array
    return new Response(
      JSON.stringify(userData || []), 
      { status: 200 }
    );
  }
  
  // Production code
  const session = await getServerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  
  const userId = session.user.id;
  const userDoc = await firestoreGetDoc(firestoreDoc(db, "users", userId));
  
  return new Response(
    JSON.stringify(userDoc.data() || {}), 
    { status: 200 }
  );
}