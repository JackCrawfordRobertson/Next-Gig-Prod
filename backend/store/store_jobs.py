# store/store_jobs.py

import firebase_admin
from firebase_admin import firestore
import hashlib

db = firestore.client()

def generate_job_id(job):
    """
    Generate a unique identifier for a job based on its URL and title.
    This helps identify duplicate jobs across all users.
    """
    # Create a string combining URL and title for uniqueness
    unique_string = f"{job['url']}_{job['title']}"
    # Generate a hash to use as document ID
    return hashlib.md5(unique_string.encode()).hexdigest()

def store_jobs(user_id, new_jobs):
    """
    Store jobs in a separate 'jobs' collection and link them to users via subcollection.
    This approach scales better for large datasets.
    
    :param user_id: The user's ID in Firestore
    :param new_jobs: Dictionary of {source: [jobObjects]} to store
    :return: Tuple of (new_jobs_count, duplicate_jobs_count)
    """
    # Reference to the main jobs collection and user's jobs subcollection
    jobs_collection = db.collection("jobs_compiled")
    user_jobs_ref = db.collection("users").document(user_id).collection("jobs")
    
    total_new = 0
    total_duplicate = 0
    
    for source, jobs_list in new_jobs.items():
        for job in jobs_list:
            # Add source information to the job
            job["source"] = source
            
            # Generate a consistent ID for this job
            job_id = generate_job_id(job)
            
            # Check if this job already exists in the main collection
            existing_job_ref = jobs_collection.document(job_id)
            existing_job = existing_job_ref.get()
            
            # Store in main jobs collection if it doesn't exist yet
            if not existing_job.exists:
                # Add metadata fields before storing
                job["first_seen"] = firestore.SERVER_TIMESTAMP
                job["sent"] = False  # New field to track email notifications
                existing_job_ref.set(job)
            
            # Check if user already has this job in their collection
            user_job_ref = user_jobs_ref.document(job_id)
            user_job = user_job_ref.get()
            
            if user_job.exists:
                total_duplicate += 1
                continue
                
            # Create a reference document in user's job collection
            user_job_ref.set({
                "job_id": job_id,
                "source": source,
                "title": job.get("title", ""),
                "company": job.get("company", ""),
                "url": job.get("url", ""),
                "location": job.get("location", ""),
                "added_at": firestore.SERVER_TIMESTAMP,
                "has_applied": False,
                "is_saved": False,
                "notes": ""
            })
            
            total_new += 1
    
    print(f"✅ Job update for {user_id}: {total_new} new jobs added, {total_duplicate} duplicates skipped")
    return total_new, total_duplicate