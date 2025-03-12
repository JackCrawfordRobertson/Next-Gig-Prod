import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { getServerSession } from "next-auth";

export async function POST(req) {
  const session = await getServerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { jobTitles, location } = await req.json();

  await setDoc(doc(db, "users", session.user.id), {
    jobTitles,
    location,
  });

  return new Response("Preferences updated", { status: 200 });
}