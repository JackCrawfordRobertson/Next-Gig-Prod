// app/api/user/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getServerSession } from "next-auth";
import mockUsers from "@/app/mock/users";
import { mockSession } from "@/app/mock/auth";

export async function GET(req) {
  // Use mock data in development
  if (process.env.NODE_ENV === "development") {
    const userId = mockSession.user.id;
    const userData = mockUsers[userId];
    
    return new Response(
      JSON.stringify(userData || {}), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Production code
  const session = await getServerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  
  const userId = session.user.id;
  const userDoc = await getDoc(doc(db, "users", userId));
  
  return new Response(
    JSON.stringify(userDoc.data() || {}), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}