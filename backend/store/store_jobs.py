import firebase_admin
from firebase_admin import firestore
import hashlib

db = firestore.client()

def generate_job_id(job):
    """
    Generate a unique identifier for a job based on its URL and title.
    This helps identify duplicate jobs across all users.
    """
    unique_string = f"{job['url']}_{job['title']}"
    return hashlib.md5(unique_string.encode()).hexdigest()

def store_jobs(user_id, new_jobs):
    """Store complete job data directly in user's subcollection"""
    user_jobs_ref = db.collection("users").document(user_id).collection("jobs")
    
    total_new = 0
    total_duplicate = 0

    for source, jobs_list in new_jobs.items():
        for job in jobs_list:
            job_id = generate_job_id(job)
            
            user_job_ref = user_jobs_ref.document(job_id)
            user_job = user_job_ref.get()

            if user_job.exists:
                total_duplicate += 1
                continue

            # Store COMPLETE job data (no references)
            complete_job_data = {
                **job,  # All original job fields
                "source": source,
                "job_id": job_id,
                "added_at": firestore.SERVER_TIMESTAMP,
                "has_applied": False,
                "is_saved": False,
                "notes": "",
                "user_id": user_id
            }
            
            user_job_ref.set(complete_job_data)
            total_new += 1

    return total_new, total_duplicate