import { db, collection, getDocs, doc, updateDoc } from "./firebase";

export async function updateJobAppliedStatus({ email, jobId, applied, source }) {
  const usersSnapshot = await getDocs(collection(db, "users"));
  const userDoc = usersSnapshot.docs.find(doc => doc.data().email === email);

  if (!userDoc) {
    throw new Error("User document not found");
  }

  const ref = doc(db, "users", userDoc.id);
  const allJobs = userDoc.data().jobs || {};
  const currentArray = allJobs[source] || [];

  const updatedArray = currentArray.map(job => {
    const fullId = `${source}-${job.id}`;
    return fullId === jobId
      ? { ...job, has_applied: applied }
      : job;
  });

  await updateDoc(ref, {
    [`jobs.${source}`]: updatedArray,
  });

  console.log(`Updated Firestore for ${source} job ${jobId}`);
}
