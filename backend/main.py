# main.py

import time
import json
import hashlib
from datetime import datetime

from config import db
from fetch.run_scrapers import run_scrapers
from store.store_jobs import store_jobs

def get_subscribed_users():
    """Fetch all users who are actively subscribed."""
    users_ref = db.collection("users").where("subscribed", "==", True).stream()
    users = [
        {
            "id": user.id,
            "jobTitles": user.to_dict().get("jobTitles", []),
            "jobLocations": user.to_dict().get("jobLocations", []),
            "email": user.to_dict().get("email", "")
        }
        for user in users_ref
    ]
    print(f"🔍 Found {len(users)} subscribed users in database")
    return users

def get_unique_job_location_pairs():
    """Get unique job title + location pairs from all subscribed users."""
    # Get all subscribed users
    users = get_subscribed_users()
    
    # Create a set to store unique job title + location pairs
    pairs = set()
    
    # Add all combinations that users are interested in
    for user in users:
        job_titles = user.get("jobTitles", [])
        job_locations = user.get("jobLocations", [])
        
        if job_titles and job_locations:
            print(f"  - User {user.get('email')}: {len(job_titles)} job titles × {len(job_locations)} locations")
            for title in job_titles:
                for location in job_locations:
                    pairs.add((title, location))
    
    print(f"✅ Identified {len(pairs)} unique job title + location pairs from {len(users)} subscribed users")
    return list(pairs)

def check_user_subscription_status():
    """Debug function to check subscription status of all users"""
    print("\n🔍 Checking subscription status for all users...")
    all_users = db.collection("users").stream()
    users_list = list(all_users)
    
    print(f"📊 Total users in database: {len(users_list)}")
    
    for user in users_list:
        user_data = user.to_dict()
        email = user_data.get("email", "Unknown")
        subscribed = user_data.get("subscribed", False)
        job_titles = user_data.get("jobTitles", [])
        job_locations = user_data.get("jobLocations", [])
        
        print(f"\nUser: {email}")
        print(f"  ID: {user.id}")
        print(f"  Subscribed: {subscribed}")
        print(f"  Job Titles: {job_titles}")
        print(f"  Job Locations: {job_locations}")
    
    print("\n")

def log_subscription_changes():
    """Log changes in user subscription status"""
    users_ref = db.collection("users").stream()
    subscribed_count = 0
    unsubscribed_count = 0
    
    for user in users_ref:
        user_data = user.to_dict()
        status = "subscribed" if user_data.get("subscribed", False) else "unsubscribed"
        print(f"User {user_data.get('email')}: {status}")
        
        if status == "subscribed":
            subscribed_count += 1
        else:
            unsubscribed_count += 1
            
    print(f"📊 Subscription Status: {subscribed_count} subscribed, {unsubscribed_count} unsubscribed")
    
    return subscribed_count > 0

def job_cycle():
    """Fetch new jobs for all subscribed users and store them in a scalable structure."""
    
    print("\n🚀 Starting job cycle")
    
    # Check all users in the database first (for debugging)
    check_user_subscription_status()
    
    # Explicitly check for subscribed users first
    users = get_subscribed_users()
    if not users:
        print("❌ No subscribed users found. Skipping scraper.")
        return False
    
    print(f"✅ Found {len(users)} subscribed users")
    
    # Get unique job title + location pairs
    job_location_pairs = get_unique_job_location_pairs()

    if not job_location_pairs:
        print("❌ No job search criteria found. Skipping scraper.")
        return False

    print(f"\n🔄 Fetching jobs for {len(job_location_pairs)} unique search combinations")
    jobs = run_scrapers(job_location_pairs)
    
    if not any(jobs.values()):
        print("❌ No jobs found in this cycle.")
        return False  # Return false to indicate no jobs were processed

    print("✅ Scraping complete. Storing results per user...")

    users = get_subscribed_users()

    for user_doc in users:
        if hasattr(user_doc, 'to_dict'):
            user = user_doc.to_dict()
            user_id = user_doc.id
            email = user.get('email', 'Unknown')
        else:
            user = user_doc
            user_id = user.get('id')
            email = user.get('email', 'Unknown')

        print(f"\n🔍 Processing jobs for user: {email}")
        
        user_jobs = {}
        total_matches = 0

        for source, job_list in jobs.items():
            matched_jobs = [
                job for job in job_list
                if any(title.lower() in job['title'].lower() for title in user.get('jobTitles', []))
                and any(loc.lower() in job['location'].lower() for loc in user.get('jobLocations', []))
            ]
            
            if matched_jobs:
                print(f"  ✅ Found {len(matched_jobs)} matching jobs from {source}")
                total_matches += len(matched_jobs)
            else:
                print(f"  ❌ No matching jobs from {source}")

            # Add source information to each job
            user_jobs[source] = matched_jobs
        
        # Only proceed if we found matches
        if total_matches > 0:
            # Use the improved store_jobs function that uses collections for scalability
            new_count, dup_count = store_jobs(user_id, user_jobs)
            print(f"💾 Updated jobs for {email} ({user_id}): {new_count} new, {dup_count} duplicates skipped")
        else:
            print(f"⚠️ No matching jobs found for {email}")
    
    return True  # Return true to indicate jobs were processed successfully

def send_email_notifications():
    """
    Send email notifications for new jobs
    """
    try:
        print("📧 Sending email notifications...")
        # Import here to avoid circular imports
        from email_service import send_job_emails
        send_job_emails()
        print("✅ Email notifications sent successfully")
        return True
    except Exception as e:
        print(f"❌ Error sending email notifications: {e}")
        return False

if __name__ == "__main__":
    start_time = time.time()
    
    try:
        # Determine which mode to run
        import sys
        
        # Default to normal job cycle
        mode = "normal"
        
        # Check command line args for mode
        if len(sys.argv) > 1:
            if sys.argv[1] == "check":
                mode = "check"
        
        # Run the appropriate mode
        if mode == "check":
            print("🔍 Running CHECK mode")
            check_user_subscription_status()
        else:
            print("🚀 Running NORMAL job cycle")
            success = job_cycle()
            
            if success:
                print("🔄 Job cycle completed. Sending email notifications...")
                try:
                    from email_service.send_email import send_job_emails
                    send_job_emails()
                except Exception as e:
                    print(f"❌ Detailed error sending email notifications: {e}")
                    import traceback
                    traceback.print_exc()
    
    except Exception as e:
        print(f"❌ Error during execution: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        elapsed_time = time.time() - start_time
        print(f"\n🕒 Total time taken: {elapsed_time:.2f} seconds.")