import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { exec } from "child_process";
import { getServerSession } from "next-auth";

export async function POST(req) {
  const session = await getServerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const userRef = doc(db, "users", userId);

  // Get user preferences
  const userDoc = await getDoc(userRef);
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