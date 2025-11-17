import { db, collection, query, getDocs, getDoc, doc, where, limit } from "@/lib/data/firebase";


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
  if (!userId) {
    console.warn("getUserJobs called with no userId");
    return [];
  }
  
  try {
    console.log(`Fetching jobs for user: ${userId}`);

    // Single query - get all job data directly
    const jobsRef = collection(db, "users", userId, "jobs");

    // Build query with all constraints
    const constraints = [];
    if (options.source) {
      constraints.push(where("source", "==", options.source));
    }
    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    const jobsQuery = constraints.length > 0 ? query(jobsRef, ...constraints) : jobsRef;
    const snapshot = await getDocs(jobsQuery);
    
    if (snapshot.empty) {
      console.log("No jobs found for user");
      return [];
    }
    
    // Simple mapping - no additional queries needed
    const jobs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Fetched ${jobs.length} jobs successfully`);
    return jobs;
    
  } catch (error) {
    console.error("Error in getUserJobs:", error);
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