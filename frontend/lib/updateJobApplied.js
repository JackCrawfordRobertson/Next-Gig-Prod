import { doc, updateDoc, db } from "@/lib/firebase";

export async function updateJobAppliedStatus({ email, jobId, applied, userId }) {
  try {
    // If we already have the userId, use it directly
    if (!userId) {
      // Otherwise get it from email using the utility function
      const { getUserByEmail } = await import("@/lib/jobDataUtils");
      const user = await getUserByEmail(email);
      if (!user) throw new Error("User not found");
      userId = user.id;
    }
    
    // Update the job in the user's job subcollection
    const jobRef = doc(db, "users", userId, "jobs", jobId);
    await updateDoc(jobRef, {
      has_applied: applied
    });
    
    console.log(`✅ Job application status updated: ${jobId} → ${applied}`);
    return true;
  } catch (error) {
    console.error("Error updating job application status:", error);
    throw error;
  }
}