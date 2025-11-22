import { db, collection, query, getDocs, getDoc, doc, where, limit } from "@/lib/data/firebase";

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
    
    const userData = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...serializeFirestoreData(userData)
    };
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

/**
 * Fetch jobs from a user's job subcollection
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {string} options.source - Filter by job source (linkedin, ifyoucould, etc)
 * @param {number} options.limit - Limit number of results
 * @param {boolean} options.includeArchived - Include archived jobs (default: false)
 * @param {boolean} options.archivedOnly - Only return archived jobs (default: false)
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
    const jobs = snapshot.docs.map(doc => {
      const jobData = doc.data();
      return {
        id: doc.id,
        ...serializeFirestoreData(jobData)
      };
    });

    // Filter archived jobs based on options
    let filteredJobs = jobs;

    if (options.archivedOnly) {
      // Only return archived jobs
      filteredJobs = jobs.filter(job => job.archived === true);
    } else if (!options.includeArchived) {
      // Default: exclude archived jobs (return only non-archived)
      filteredJobs = jobs.filter(job => job.archived !== true);
    }
    // If includeArchived is true, return all jobs (no filtering)

    console.log(`Fetched ${filteredJobs.length} jobs successfully (${jobs.length} total)`);
    return filteredJobs;

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

/**
 * Get archived jobs (jobs user has applied to or wants to focus on)
 */
export async function getArchivedJobs(userId) {
  return await getUserJobs(userId, { archivedOnly: true });
}