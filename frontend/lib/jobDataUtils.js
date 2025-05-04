import { db, collection, query, getDocs, getDoc, doc, where, limit } from "@/lib/firebase";


/**
 * Get a user document by email
 */
export async function getUserByEmail(email) {
  if (!email) return null;
  
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.warn(`No user found with email: ${email}`);
      return null;
    }
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

/**
 * Fetch jobs from a user's job subcollection
 */
export async function getUserJobs(userId, options = {}) {
  console.log(`Starting getUserJobs for user: ${userId}`, options);
  
  if (!userId) {
    console.warn("getUserJobs called with no userId");
    return [];
  }
  
  try {
    // Create reference to user's jobs subcollection
    const jobsRef = collection(db, "users", userId, "jobs");
    console.log("Created jobs collection reference");
    
    // Build query with options
    let jobsQuery = jobsRef;
    if (options.source) {
      console.log(`Adding source filter: ${options.source}`);
      jobsQuery = query(jobsRef, where("source", "==", options.source));
    }
    if (options.limit) {
      console.log(`Adding limit: ${options.limit}`);
      jobsQuery = query(jobsQuery, limit(options.limit));
    }
    
    // Get the jobs from subcollection
    console.log("Executing jobs query...");
    const snapshot = await getDocs(jobsQuery);
    console.log(`Query returned ${snapshot.size} documents`);
    
    if (snapshot.empty) {
      console.log("No jobs found in subcollection");
      return [];
    }
    
    // Use try/catch for each promise to prevent total failure
    const jobPromises = snapshot.docs.map(async (jobDoc, index) => {
      try {
        const jobData = jobDoc.data();
        const jobId = jobDoc.id;
        
        // Get full job data from jobs_compiled collection
        const fullJobRef = doc(db, "jobs_compiled", jobId);
        const fullJobSnap = await getDoc(fullJobRef);
        
        if (fullJobSnap.exists()) {
          return {
            ...fullJobSnap.data(),
            ...jobData,
            id: jobId,
            source: jobData.source || "unknown"
          };
        }
        console.log(`No full data found for job ${jobId}`);
        return null;
      } catch (err) {
        console.error(`Error processing job ${jobDoc.id}:`, err);
        return null; // Prevent this error from failing the whole operation
      }
    });
    
    const jobResults = await Promise.all(jobPromises);
    return jobResults.filter(job => job !== null);
    
  } catch (error) {
    console.error("Error in getUserJobs:", error.message);
    console.error("Stack trace:", error.stack);
    return []; // Return empty array even on error
  }
}

/**
 * Get recent jobs (last 24 hours)
 */
export async function getRecentJobs(userId) {
  const allJobs = await getUserJobs(userId);
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  return allJobs.filter(job => {
    const jobDate = job.date_added ? new Date(job.date_added) : new Date();
    return jobDate >= oneDayAgo;
  });
}