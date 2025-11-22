import { db, doc, updateDoc, serverTimestamp } from "@/lib/data/firebase";

/**
 * Archive a job (mark as archived so it doesn't show in main lists)
 * @param {string} userId - The user's ID
 * @param {string} jobId - The job document ID
 * @param {Function} showToast - Optional toast function
 * @returns {Promise<boolean>} - Success status
 */
export async function archiveJob(userId, jobId, showToast = null) {
  try {
    if (!userId || !jobId) {
      throw new Error("Missing userId or jobId");
    }

    const jobRef = doc(db, "users", userId, "jobs", jobId);

    await updateDoc(jobRef, {
      archived: true,
      archivedAt: serverTimestamp(),
    });

    if (showToast) {
      showToast({
        title: "Job Archived",
        description: "Job moved to Applied Jobs",
        variant: "success",
      });
    }

    console.log(`✅ Archived job ${jobId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error archiving job:", error);

    if (showToast) {
      showToast({
        title: "Archive Failed",
        description: "Could not archive job. Please try again.",
        variant: "destructive",
      });
    }

    return false;
  }
}

/**
 * Unarchive a job (restore to main lists)
 * @param {string} userId - The user's ID
 * @param {string} jobId - The job document ID
 * @param {Function} showToast - Optional toast function
 * @returns {Promise<boolean>} - Success status
 */
export async function unarchiveJob(userId, jobId, showToast = null) {
  try {
    if (!userId || !jobId) {
      throw new Error("Missing userId or jobId");
    }

    const jobRef = doc(db, "users", userId, "jobs", jobId);

    await updateDoc(jobRef, {
      archived: false,
      unarchivedAt: serverTimestamp(),
    });

    if (showToast) {
      showToast({
        title: "Job Restored",
        description: "Job moved back to main list",
        variant: "success",
      });
    }

    console.log(`✅ Unarchived job ${jobId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error unarchiving job:", error);

    if (showToast) {
      showToast({
        title: "Restore Failed",
        description: "Could not restore job. Please try again.",
        variant: "destructive",
      });
    }

    return false;
  }
}

/**
 * Toggle archive status of a job
 * @param {string} userId - The user's ID
 * @param {string} jobId - The job document ID
 * @param {boolean} currentlyArchived - Current archive status
 * @param {Function} showToast - Optional toast function
 * @returns {Promise<boolean>} - Success status
 */
export async function toggleArchiveStatus(userId, jobId, currentlyArchived, showToast = null) {
  if (currentlyArchived) {
    return await unarchiveJob(userId, jobId, showToast);
  } else {
    return await archiveJob(userId, jobId, showToast);
  }
}
