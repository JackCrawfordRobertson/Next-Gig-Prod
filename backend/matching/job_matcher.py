def get_unmatched_jobs():
    # Retrieve jobs from jobs_compiled that haven't been matched
    jobs_collection = db.collection("jobs_compiled")
    unmatched_jobs_query = jobs_collection.where("matched", "==", False)
    return [job.to_dict() for job in unmatched_jobs_query.stream()]

def get_active_users():
    # Fetch subscribed users with job preferences
    users_ref = db.collection("users").where("subscribed", "==", True)
    return [
        {
            "id": user.id,
            **user.to_dict()
        } 
        for user in users_ref.stream()
    ]

def filter_jobs_for_user(user, unmatched_jobs):
    matching_jobs = []
    user_job_titles = [title.lower() for title in user.get('jobTitles', [])]
    user_job_locations = [loc.lower() for loc in user.get('jobLocations', [])]
    
    for job in unmatched_jobs:
        job_title = job.get('title', '').lower()
        job_location = job.get('location', '').lower()
        
        title_match = any(title in job_title for title in user_job_titles)
        location_match = any(loc in job_location for loc in user_job_locations)
        
        if title_match and location_match:
            matching_jobs.append(job)
    
    return matching_jobs

def create_user_job_matches(user_id, matching_jobs):
    # Create matches in a new user_job_matches collection
    batch = db.batch()
    
    for job in matching_jobs:
        job_id = generate_job_id(job)
        
        # Reference to user job matches
        match_ref = db.collection("user_job_matches").document()
        
        # Create match document
        match_data = {
            "user_id": user_id,
            "job_id": job_id,
            "job_details": job,
            "matched_at": firestore.SERVER_TIMESTAMP,
            "notified": False
        }
        
        # Add to batch
        batch.set(match_ref, match_data)
        
        # Mark job as matched in original collection
        job_ref = db.collection("jobs_compiled").document(job_id)
        batch.update(job_ref, {"matched": True})
    
    # Commit batch
    batch.commit()

def match_jobs_to_users():
    # Main matching function
    unmatched_jobs = get_unmatched_jobs()
    active_users = get_active_users()
    
    for user in active_users:
        matching_jobs = filter_jobs_for_user(user, unmatched_jobs)
        
        if matching_jobs:
            create_user_job_matches(user['id'], matching_jobs)