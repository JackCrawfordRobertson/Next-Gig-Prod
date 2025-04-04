# migrate_jobs.py

import firebase_admin
from firebase_admin import firestore
import hashlib

# Ensure Firebase is initialized
from config import db

def generate_job_id(job):
    """Generate a unique identifier for a job."""
    unique_string = f"{job['url']}_{job['title']}"
    return hashlib.md5(unique_string.encode()).hexdigest()

def migrate_to_new_structure():
    """
    Migrate existing job data to the new collection-based structure.
    This preserves all existing job data while setting up the new schema.
    """
    print("🔄 Starting migration to new job storage structure...")
    
    # Get all users
    users = db.collection("users").stream()
    total_users = 0
    total_jobs = 0
    
    # Process each user
    for user in users:
        total_users += 1
        user_id = user.id
        user_data = user.to_dict()
        
        # Skip users without jobs
        if "jobs" not in user_data:
            print(f"⏩ User {user_id} has no jobs to migrate")
            continue
            
        print(f"🔄 Migrating jobs for user {user_id}...")
        
        # Get all existing jobs by source
        existing_jobs = user_data.get("jobs", {})
        user_job_count = 0
        
        # Initialize a batch write for efficiency
        batch = db.batch()
        
        # Create a reference to the user's job subcollection
        user_jobs_ref = db.collection("users").document(user_id).collection("jobs")
        
        # Process each job source
        for source, jobs_list in existing_jobs.items():
            for job in jobs_list:
                # Generate consistent ID
                job_id = generate_job_id(job)
                
                # Add job to main collection if not already there
                main_job_ref = db.collection("jobs_compiled").document(job_id)
                
                # Add to the batch
                if not main_job_ref.get().exists:
                    job["source"] = source
                    job["first_seen"] = firestore.SERVER_TIMESTAMP
                    job["sent"] = True  # Assume already notified for existing jobs
                    batch.set(main_job_ref, job)
                
                # Add to user's subcollection
                user_job_ref = user_jobs_ref.document(job_id)
                batch.set(user_job_ref, {
                    "job_id": job_id,
                    "source": source,
                    "title": job.get("title", ""),
                    "company": job.get("company", ""),
                    "url": job.get("url", ""),
                    "location": job.get("location", ""),
                    "added_at": firestore.SERVER_TIMESTAMP,
                    "has_applied": job.get("has_applied", False),
                    "is_saved": False,
                    "notes": ""
                })
                
                user_job_count += 1
                total_jobs += 1
        
        # Commit the batch
        batch.commit()
        print(f"✅ Migrated {user_job_count} jobs for user {user_id}")
    
    print(f"✅ Migration complete! Processed {total_users} users and {total_jobs} total jobs")

if __name__ == "__main__":
    migrate_to_new_structure()