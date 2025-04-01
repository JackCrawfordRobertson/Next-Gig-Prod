export async function updateJobAppliedStatus({ email, jobId, applied, source }) {
  const usersSnapshot = await getDocs(collection(db, "users"));
  const userDoc = usersSnapshot.docs.find(doc => doc.data().email === email);

  if (!userDoc) {
    throw new Error("User document not found");
  }

  const ref = doc(db, "users", userDoc.id);
  const allJobs = userDoc.data().jobs || {};
  const currentArray = allJobs[source] || [];

  const cleanId = jobId.replace(`${source}-`, "");

  const updatedArray = currentArray.map(job =>
    job.id === cleanId
      ? { ...job, has_applied: applied }
      : job
  );

  await updateDoc(ref, {
    [`jobs.${source}`]: updatedArray,
  });

  console.log(`✅ Firestore updated: ${source} job ${cleanId} marked as ${applied}`);
}
