import firebase_admin
from firebase_admin import firestore
import hashlib
import time

db = firestore.client()

def generate_job_id(job):
    """Generate a unique identifier for a job based on its URL."""
    # Use only URL for consistency
    return hashlib.md5(job["url"].encode()).hexdigest()

def store_jobs(user_id, new_jobs):
    """
    Store jobs with proper email notification tracking and source validation
    """
    user_jobs_ref = db.collection("users").document(user_id).collection("jobs")
    
    total_new = 0
    total_duplicate = 0

    for source, jobs_list in new_jobs.items():
        for job in jobs_list:
            # Validate that job has the correct source
            if job.get('source') != source:
                print(f"⚠️ Source mismatch detected! Expected: {source}, Got: {job.get('source')}")
                job["source"] = source  # Force correct source
            
            job_id = generate_job_id(job)
            
            print(f"🔍 Processing job: {job_id} - {job['title']} from {source}")

            # Check if job already exists in user's collection
            user_job_ref = user_jobs_ref.document(job_id)
            user_job = user_job_ref.get()

            if user_job.exists:
                print(f"⚠️ Duplicate job skipped: {job['title']}")
                total_duplicate += 1
                continue

            # Prepare complete job data
            complete_job_data = {
                **job,  # All original job fields
                "job_id": job_id,
                "user_id": user_id,
                "source": source,  # Explicitly set source
                "added_at": firestore.SERVER_TIMESTAMP,
                "has_applied": False,
                "is_saved": False,
                "notes": ""
            }

            # Store job in user's subcollection
            user_job_ref.set(complete_job_data)
            
            # Create email notification record with timestamp
            notification_id = f"{user_id}_{job_id}_{int(time.time() * 1000000)}"
            
            try:
                db.collection("user_job_matches").document(notification_id).set({
                    "user_id": user_id,
                    "job_id": job_id,
                    "job_details": complete_job_data,
                    "matched_at": firestore.SERVER_TIMESTAMP,
                    "notified": False
                })
                print(f"✅ Email notification record created for: {job['title']}")
            except Exception as e:
                print(f"❌ Failed to create email notification: {e}")

            total_new += 1
            print(f"✅ Stored job: {job['title']} at {job.get('company', 'Unknown')} (Source: {source})")

    print(f"📊 Job storage summary - New: {total_new}, Duplicates: {total_duplicate}")
    return total_new, total_duplicate