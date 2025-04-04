import time
import hashlib
import uuid
from config import db
from firebase_admin import firestore
from fetch.run_scrapers import run_scrapers

def generate_document_id(url):
    """Generate a Firestore-safe document ID from a job URL using hashing."""
    return hashlib.md5(url.encode()).hexdigest()

def get_subscribed_users():
    """Fetch all users who are actively subscribed."""
    users_ref = db.collection("users").where("subscribed", "==", True).stream()
    return [
        {
            "id": user.id,
            "jobTitles": user.to_dict().get("jobTitles", []),
            "jobLocations": user.to_dict().get("jobLocations", []),
            "email": user.to_dict().get("email", "")
        }
        for user in users_ref
    ]

def consolidated_job_scraping(test_mode=False):
    """
    Efficiently scrape jobs for all subscribed users in one pass.
    """
    # Get users (test or all subscribed)
    if test_mode:
        users = db.collection("users").where("email", "in", 
                         ["test_user1@nexgig.com", "test_user2@nexgig.com", "test_user3@nexgig.com"]).stream()
        users = [{
            "id": user.id,
            "jobTitles": user.to_dict().get("jobTitles", []),
            "jobLocations": user.to_dict().get("jobLocations", []),
            "email": user.to_dict().get("email", "")
        } for user in users]
    else:
        users = get_subscribed_users()
    
    if not users:
        print("❌ No active users found. Skipping scraper.")
        return
    
    # Collect unique job titles and locations
    job_titles = set()
    job_locations = set()
    
    for user in users:
        job_titles.update(user.get("jobTitles", []))
        job_locations.update(user.get("jobLocations", []))
    
    job_titles = list(job_titles)
    job_locations = list(job_locations)
    
    if not job_titles or not job_locations:
        print("❌ No job titles or locations found. Skipping scraper.")
        return
    
    print(f"🔍 Scraping for {len(job_titles)} unique job titles across {len(job_locations)} locations")
    
    # Run scrapers once for all unique combinations
    all_jobs = run_scrapers(job_titles, job_locations)
    
    if not any(all_jobs.values()):
        print("❌ No jobs found in this cycle.")
        return
    
    # Prepare batch write for consolidated jobs
    batch = db.batch()
    
    # User-specific job matching
    user_job_matches = {}
    
    for source, jobs_list in all_jobs.items():
        for job in jobs_list:
            # Generate unique document ID
            job_id = generate_document_id(job["url"])
            
            # Prepare job document
            job_doc = {
                **job,
                "id": job_id,
                "source": source,
                "creation_date": firestore.SERVER_TIMESTAMP,
                "matched_users": []  # Track which users this job matches
            }
            
            # Match job to users
            for user in users:
                # Check if job matches user's titles and locations
                if (any(title.lower() in job["title"].lower() for title in user.get("jobTitles", [])) and
                    any(loc.lower() in job["location"].lower() for loc in user.get("jobLocations", []))):
                    
                    # Track matched users for this job
                    job_doc['matched_users'].append(user['id'])
                    
                    # Collect job for this user
                    if user['id'] not in user_job_matches:
                        user_job_matches[user['id']] = {}
                    
                    if source not in user_job_matches[user['id']]:
                        user_job_matches[user['id']][source] = []
                    
                    user_job_matches[user['id']][source].append(job)
            
            # Write job to consolidated jobs collection
            job_ref = db.collection("jobs_compiled").document(job_id)
            batch.set(job_ref, job_doc, merge=True)
    
    # Commit batch write of all jobs
    batch.commit()
    print(f"✅ Stored {len(all_jobs)} job sources in central repository")
    
    # Update each user with their matched jobs
    for user_id, matched_jobs in user_job_matches.items():
        if matched_jobs:
            user_ref = db.collection("users").document(user_id)
            
            # Add job references to user document
            user_ref.update({
                "recent_job_matches": matched_jobs,
                "last_job_match_timestamp": firestore.SERVER_TIMESTAMP
            })
            
            print(f"📎 Matched jobs for user {user_id}: {sum(len(jobs) for jobs in matched_jobs.values())} jobs")
    
    return user_job_matches

def run_test():
    """Test the consolidated job scraping process."""
    start_time = time.time()
    
    try:
        print("🧪 Starting Consolidated Job Scraping Test...")
        
        # Run job scraping
        job_matches = consolidated_job_scraping(test_mode=True)
        
        # Print out detailed results
        if job_matches:
            print("\n📊 Job Match Details:")
            for user_id, sources in job_matches.items():
                print(f"User {user_id} Matches:")
                for source, jobs in sources.items():
                    print(f"  {source}: {len(jobs)} jobs")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
    finally:
        elapsed_time = time.time() - start_time
        print(f"\n🕒 Total test time: {elapsed_time:.2f} seconds")

if __name__ == "__main__":
    run_test()