# main.py

import time
import json
import uuid
import hashlib
from datetime import datetime

from config import db
from fetch.run_scrapers import run_scrapers
from store.store_jobs import store_jobs, generate_job_id

def create_test_user():
    """
    Create a test user in Firestore for job scraping testing.
    """
    test_user_data = {
        "email": "test_user@nexgig.com",
        "jobTitles": ["Frontend Engineer", "UX Designer"],
        "jobLocations": ["London", "Remote"],
        "subscribed": True,
        "created_at": datetime.now()
    }
    
    # Check if test user already exists
    existing_users = db.collection("users").where("email", "==", "test_user@nexgig.com").stream()
    existing_users = list(existing_users)
    
    if existing_users:
        print("🔍 Test user already exists.")
        return existing_users[0].id
    
    # Create new test user
    test_user_ref = db.collection("users").add(test_user_data)
    print("🆕 Created test user for job scraping.")
    return test_user_ref[1].id

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

def get_unique_job_titles(test_mode=False):
    """Get unique job titles from all subscribed users."""
    if test_mode:
        # Return test user's job titles
        test_user = db.collection("users").where("email", "==", "test_user@nexgig.com").stream()
        test_user = list(test_user)
        if test_user:
            return test_user[0].to_dict().get("jobTitles", [])
    
    users = get_subscribed_users()
    job_titles = set()
    for user in users:
        job_titles.update(user["jobTitles"])
    return list(job_titles)

def get_unique_job_locations(test_mode=False):
    """Get unique job locations from all subscribed users."""
    if test_mode:
        # Return test user's job locations
        test_user = db.collection("users").where("email", "==", "test_user@nexgig.com").stream()
        test_user = list(test_user)
        if test_user:
            return test_user[0].to_dict().get("jobLocations", [])
    
    users = get_subscribed_users()
    locations = set()
    for user in users:
        locations.update(user["jobLocations"])
    return list(locations)

# main.py - Add a new function to call after job scraping

def job_cycle(test_mode=False):
    """Fetch new jobs for all subscribed users and store them in a scalable structure."""
    job_titles = get_unique_job_titles(test_mode)
    job_locations = get_unique_job_locations(test_mode)

    if not job_titles:
        print("❌ No active users or job titles found. Skipping scraper.")
        return False  # Return false to indicate no jobs were processed

    print(f"\n🔄 Fetching jobs for: {job_titles} in {job_locations}")
    jobs = run_scrapers(job_titles, job_locations) 
    
    if not any(jobs.values()):
        print("❌ No jobs found in this cycle.")
        return False  # Return false to indicate no jobs were processed

    print("✅ Scraping complete. Storing results per user...")

    users = [next(db.collection("users").where("email", "==", "test_user@nexgig.com").stream())] if test_mode else get_subscribed_users()

    for user_doc in users:
        user = user_doc.to_dict() if hasattr(user_doc, 'to_dict') else user_doc
        user_id = user_doc.id if hasattr(user_doc, 'id') else user.get('id')

        user_jobs = {}

        for source, job_list in jobs.items():
            matched_jobs = [
                job for job in job_list
                if any(title.lower() in job['title'].lower() for title in user['jobTitles']) and
                   any(loc.lower() in job['location'].lower() for loc in user['jobLocations'])
            ]

            # Add source information to each job
            user_jobs[source] = matched_jobs
        
        # Use the improved store_jobs function that uses collections for scalability
        new_count, dup_count = store_jobs(user_id, user_jobs)

        print(f"💾 Updated jobs for {user_id}: {new_count} new, {dup_count} duplicates skipped")
    
    return True  # Return true to indicate jobs were processed successfully

if __name__ == "__main__":
    start_time = time.time()
    
    try:
        # Run the job cycle
        success = job_cycle()
        
        if success:
            print("🔄 Job cycle completed. Sending email notifications...")
            # Import the email functionality 
            from email_service.send_email import send_job_emails
            send_job_emails()
        
    except Exception as e:
        print(f"❌ Error during execution: {e}")
    finally:
        elapsed_time = time.time() - start_time
        print(f"\n🕒 Total time taken: {elapsed_time:.2f} seconds.")

def quick_test():
    """
    Quick test function to validate job scraping and storing.
    """
    print("🔍 Running Quick Test for Job Scraping...")
    
    # Create a test user
    test_user_id = create_test_user()
    print(f"🧪 Test User ID: {test_user_id}")
    
    # Run job cycle in test mode
    job_cycle(test_mode=True)

def cleanup_test_user():
    """
    Remove the test user from Firestore.
    """
    test_users = db.collection("users").where("email", "==", "test_user@nexgig.com").stream()
    for user in test_users:
        print(f"🗑️ Deleting test user: {user.id}")
        
        # Also delete all jobs in the user's subcollection
        user_jobs = db.collection("users").document(user.id).collection("jobs").stream()
        for job in user_jobs:
            job.reference.delete()
            
        # Delete the user document
        db.collection("users").document(user.id).delete()

if __name__ == "__main__":
    start_time = time.time()
    
    try:
        # Uncomment the function you want to run
        job_cycle()  # Normal job cycle
        # quick_test()  # Quick test mode
    except Exception as e:
        print(f"❌ Error during testing: {e}")
    finally:
        # Optional: Cleanup test user
        # Uncomment if you want to remove the test user after each run
        # cleanup_test_user()
        
        elapsed_time = time.time() - start_time
        print(f"\n🕒 Total time taken: {elapsed_time:.2f} seconds.")