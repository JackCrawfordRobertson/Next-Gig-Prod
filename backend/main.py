# main.py

import time
import json
import hashlib
from datetime import datetime
import logging

from config import db, MAX_SEARCH_RADIUS_KM
from fetch.run_scrapers import run_scrapers
from store.store_jobs import store_jobs
from utils.location_matcher import find_matching_jobs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("job_cycle.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def get_subscribed_users():
    """Fetch all users who are actively subscribed."""
    try:
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
        logger.info(f"🔍 Found {len(users)} subscribed users in database")
        return users
    except Exception as e:
        logger.error(f"Error fetching subscribed users: {e}")
        return []

def get_unique_job_location_pairs(users):
    """
    Get unique job title + location pairs from all subscribed users.
    
    :param users: List of subscribed users
    :return: List of unique (job_title, location) pairs
    """
    pairs = set()
    
    for user in users:
        job_titles = user.get("jobTitles", [])
        job_locations = user.get("jobLocations", [])
        
        if job_titles and job_locations:
            logger.info(f"  - User {user.get('email')}: {len(job_titles)} job titles × {len(job_locations)} locations")
            for title in job_titles:
                for location in job_locations:
                    pairs.add((title, location))
    
    logger.info(f"✅ Identified {len(pairs)} unique job title + location pairs from {len(users)} subscribed users")
    return list(pairs)

def advanced_job_matching(all_jobs, user):
    """
    Advanced job matching with location and title intelligence
    
    :param all_jobs: Dictionary of jobs from all sources
    :param user: User dictionary
    :return: Matched jobs for the user
    """
    user_preferences = {
        'job_titles': user.get('jobTitles', []),
        'locations': user.get('jobLocations', [])
    }
    
    # Collect jobs from all sources
    combined_jobs = []
    for source_jobs in all_jobs.values():
        combined_jobs.extend(source_jobs)
    
    # Find matching jobs with location intelligence
    try:
        matched_jobs = find_matching_jobs(
            combined_jobs, 
            user_preferences, 
            max_radius_km=MAX_SEARCH_RADIUS_KM
        )
        
        logger.info(f"User {user.get('email')} - Found {len(matched_jobs)} location-matched jobs")
        return matched_jobs
    except Exception as e:
        logger.error(f"Error in advanced job matching for user {user.get('email')}: {e}")
        return []

def categorize_matched_jobs(matched_jobs, all_jobs):
    """
    Categorize matched jobs by their original source
    
    :param matched_jobs: List of matched jobs
    :param all_jobs: Original job sources
    :return: Dictionary of matched jobs by source
    """
    categorized_jobs = {}
    
    for source, source_jobs in all_jobs.items():
        source_matched_jobs = [
            job for job in source_jobs 
            if job in matched_jobs
        ]
        
        if source_matched_jobs:
            categorized_jobs[source] = source_matched_jobs
    
    return categorized_jobs

def job_cycle():
    """
    Fetch new jobs for all subscribed users and store them in a scalable structure.
    """
    logger.info("\n🚀 Starting job cycle")
    
    # Get subscribed users
    users = get_subscribed_users()
    if not users:
        logger.warning("❌ No subscribed users found. Skipping scraper.")
        return False
    
    # Get unique job search combinations
    job_location_pairs = get_unique_job_location_pairs(users)
    if not job_location_pairs:
        logger.warning("❌ No job search criteria found. Skipping scraper.")
        return False
    
    # Run scrapers for all unique combinations
    logger.info(f"\n🔄 Fetching jobs for {len(job_location_pairs)} unique search combinations")
    jobs = run_scrapers(job_location_pairs)
    
    if not any(jobs.values()):
        logger.warning("❌ No jobs found in this cycle.")
        return False
    
    logger.info("✅ Scraping complete. Storing results per user...")
    
    # Process jobs for each user
    for user in users:
        try:
            user_id = user.get('id')
            email = user.get('email', 'Unknown')
            
            logger.info(f"\n🔍 Processing jobs for user: {email}")
            
            # Advanced location-aware job matching
            matched_jobs = advanced_job_matching(jobs, user)
            
            if not matched_jobs:
                logger.info(f"⚠️ No matching jobs found for {email}")
                continue
            
            # Categorize matched jobs by source
            user_jobs = categorize_matched_jobs(matched_jobs, jobs)
            
            # Store matched jobs
            new_count, dup_count = store_jobs(user_id, user_jobs)
            logger.info(f"💾 Updated jobs for {email} ({user_id}): {new_count} new, {dup_count} duplicates skipped")
        
        except Exception as e:
            logger.error(f"Error processing jobs for user {email}: {e}")
    
    return True

def send_email_notifications():
    """
    Send email notifications for new jobs
    """
    try:
        logger.info("📧 Sending email notifications...")
        # Import here to avoid circular imports
        from email_service import send_job_emails
        send_job_emails()
        logger.info("✅ Email notifications sent successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Error sending email notifications: {e}")
        return False

def main():
    """
    Main execution function with comprehensive error handling and timing
    """
    start_time = time.time()
    
    try:
        # Run job cycle
        jobs_processed = job_cycle()
        
        # Send notifications if jobs were processed
        if jobs_processed:
            send_email_notifications()
    
    except Exception as e:
        logger.error(f"❌ Unexpected error during job cycle: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        elapsed_time = time.time() - start_time
        logger.info(f"\n🕒 Total job cycle time: {elapsed_time:.2f} seconds")

if __name__ == "__main__":
    main()