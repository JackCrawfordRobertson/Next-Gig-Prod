import { db, collection, query, getDocs, getDoc, doc, where } from "@/lib/firebase";

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
  if (!userId) return [];
  
  try {
    // Create reference to user's jobs subcollection
    const jobsRef = collection(db, "users", userId, "jobs");
    
    // Build query with options
    let jobsQuery = jobsRef;
    if (options.source) {
      jobsQuery = query(jobsRef, where("source", "==", options.source));
    }
    if (options.limit) {
      jobsQuery = query(jobsQuery, limit(options.limit));
    }
    
    // Get the jobs from subcollection
    const snapshot = await getDocs(jobsQuery);
    
    if (snapshot.empty) {
      return [];
    }
    
    // Fetch the full job details for each job reference
    const jobPromises = snapshot.docs.map(async (jobDoc) => {
      const jobData = jobDoc.data();
      const jobId = jobDoc.id;
      
      // Get full job data from jobs_compiled collection
      const fullJobRef = doc(db, "jobs_compiled", jobId);
      const fullJobSnap = await getDoc(fullJobRef);
      
      if (fullJobSnap.exists()) {
        // Combine the user-specific data with the full job data
        return {
          ...fullJobSnap.data(),
          ...jobData,
          id: jobId,
          source: jobData.source // Ensure source is preserved
        };
      }
      return null;
    });
    
    const jobResults = await Promise.all(jobPromises);
    return jobResults.filter(job => job !== null);
    
  } catch (error) {
    console.error("Error fetching user jobs:", error);
    return [];
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