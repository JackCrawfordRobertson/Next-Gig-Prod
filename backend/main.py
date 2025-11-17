# main.py

import time
import json
import hashlib
from datetime import datetime
import logging

from config import db
from fetch.run_scrapers import run_scrapers
from store.store_jobs import store_jobs

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
    """
    FREE ACCESS MODE: Fetch all users (no subscription check).
    Previously only fetched subscribed users, now fetches all active users.
    """
    try:
        # FREE MODE: Get ALL users, not just subscribed ones
        users_ref = db.collection("users").stream()
        users = [
            {
                "id": user.id,
                "jobTitles": user.to_dict().get("jobTitles", []),
                "jobLocations": user.to_dict().get("jobLocations", []),
                "email": user.to_dict().get("email", "")
            }
            for user in users_ref
            # Only include users with job preferences set
            if user.to_dict().get("jobTitles") and user.to_dict().get("jobLocations")
        ]
        logger.info(f"🔍 Found {len(users)} users with job preferences in database (FREE MODE - all users included)")
        return users
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
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

def simple_job_matching(all_jobs, user):
    """
    Simple job matching based on title and location text matching
    
    :param all_jobs: Dictionary of jobs from all sources
    :param user: User dictionary
    :return: Matched jobs for the user
    """
    user_titles = [t.lower() for t in user.get('jobTitles', [])]
    user_locations = [l.lower() for l in user.get('jobLocations', [])]
    
    matched_jobs = []
    
    for source, source_jobs in all_jobs.items():
        for job in source_jobs:
            job_title = job.get('title', '').lower()
            job_location = job.get('location', '').lower()
            
            # Check if title matches
            title_match = any(title in job_title for title in user_titles)
            
            # Check if location matches
            location_match = any(loc in job_location for loc in user_locations)
            
            if title_match and location_match:
                job_with_source = job.copy()
                job_with_source['source'] = source
                matched_jobs.append(job_with_source)
    
    logger.info(f"User {user.get('email')} - Found {len(matched_jobs)} matched jobs")
    return matched_jobs

def categorize_matched_jobs(matched_jobs, all_jobs):
    """
    Categorize matched jobs by their original source using URL as unique identifier
    
    :param matched_jobs: List of matched jobs
    :param all_jobs: Original job sources
    :return: Dictionary of matched jobs by source
    """
    categorized_jobs = {}
    
    # Create a map of job URLs to sources
    url_to_source = {}
    for source, source_jobs in all_jobs.items():
        for job in source_jobs:
            url_to_source[job.get('url')] = source
    
    # Categorize matched jobs based on their URLs
    for job in matched_jobs:
        job_url = job.get('url')
        if job_url in url_to_source:
            source = url_to_source[job_url]
            if source not in categorized_jobs:
                categorized_jobs[source] = []
            
            # Ensure source is set correctly on the job object
            job['source'] = source
            categorized_jobs[source].append(job)
        else:
            logger.warning(f"Could not find source for job: {job.get('title')} - {job_url}")
    
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
            
            # Simple job matching
            matched_jobs = simple_job_matching(jobs, user)
            
            if not matched_jobs:
                logger.info(f"⚠️ No matching jobs found for {email}")
                continue
            
            # Categorize matched jobs by source
            user_jobs = categorize_matched_jobs(matched_jobs, jobs)
            
            # Log categorization results
            logger.info(f"📊 Categorized jobs for {email}:")
            for source, source_jobs in user_jobs.items():
                logger.info(f"  - {source}: {len(source_jobs)} jobs")
            
            # Store matched jobs
            new_count, dup_count = store_jobs(user_id, user_jobs)
            logger.info(f"💾 Updated jobs for {email} ({user_id}): {new_count} new, {dup_count} duplicates skipped")
        
        except Exception as e:
            logger.error(f"Error processing jobs for user {email}: {e}")
            import traceback
            traceback.print_exc()
    
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