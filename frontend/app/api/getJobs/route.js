import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getServerSession } from "next-auth";

export async function GET(req) {
  const session = await getServerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const userDoc = await getDoc(doc(db, "users", userId));

  return new Response(JSON.stringify(userDoc.data()?.jobs || []), { status: 200 });
}