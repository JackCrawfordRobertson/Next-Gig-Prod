# utils/get_user_jobs.py

import firebase_admin
from firebase_admin import firestore

# Ensure Firebase is initialized
from config import db

def get_user_jobs(user_id, limit=50, only_saved=False):
    """
    Retrieve jobs for a specific user with the new collection-based structure.
    
    :param user_id: The user's Firestore ID
    :param limit: Maximum number of jobs to return (default 50)
    :param only_saved: Only return jobs marked as saved
    :return: List of job objects with full details
    """
    # Reference to the user's jobs subcollection
    user_jobs_ref = db.collection("users").document(user_id).collection("jobs")
    
    # Create the query
    query = user_jobs_ref.order_by("added_at", direction=firestore.Query.DESCENDING).limit(limit)
    
    # Apply filter for saved jobs if requested
    if only_saved:
        query = query.where("is_saved", "==", True)
    
    # Execute the query
    user_jobs = query.stream()
    
    # Prepare result array
    jobs = []
    
    # Process each job
    for user_job in user_jobs:
        user_job_data = user_job.to_dict()
        job_id = user_job_data.get("job_id")
        
        # Get the full job details from the main collection
        full_job = db.collection("jobs_compiled").document(job_id).get()
        
        if full_job.exists:
            full_job_data = full_job.to_dict()
            
            # Merge the user-specific data with the full job data
            result = {**full_job_data, **user_job_data}
            jobs.append(result)
    
    return jobs

if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
        print(f"Fetching jobs for user {user_id}...")
        
        jobs = get_user_jobs(user_id)
        print(f"Found {len(jobs)} jobs")
        
        for job in jobs[:5]:  # Show first 5 jobs
            print(f"- {job['title']} at {job['company']} ({job['location']})")
    else:
        print("Please provide a user ID")