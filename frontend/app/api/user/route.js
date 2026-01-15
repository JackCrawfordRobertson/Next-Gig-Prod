// app/api/user/route.js
import { db } from "@/lib/data/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Serialize Firestore data to plain objects
 * Converts Timestamps to ISO strings
 */
function serializeFirestoreData(data) {
  if (!data) return data;

  const serialized = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && value.toDate) {
      // Firestore Timestamp
      serialized[key] = value.toDate().toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Nested object
      serialized[key] = serializeFirestoreData(value);
    } else {
      serialized[key] = value;
    }
  }
  return serialized;
}

export async function GET(req) {
  // Always fetch production data
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

    // Fetch from jobs subcollection
    const jobsRef = collection(db, "users", userId, "jobs");
    const jobsSnapshot = await getDocs(jobsRef);

    const transformedJobs = [];
    jobsSnapshot.forEach((jobDoc) => {
      const jobData = jobDoc.data();
      transformedJobs.push({
        ...jobData,
        id: jobDoc.id,
        job_id: jobDoc.id,
        user_id: userId,
        // Ensure serialization of Firestore Timestamps
        ...serializeFirestoreData(jobData)
      });
    });

    console.log(`Fetched ${transformedJobs.length} jobs from subcollection`);

    return new Response(
      JSON.stringify({
        userId: userId,
        transformedJobs: transformedJobs,
        jobsCollection: transformedJobs
      }),
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