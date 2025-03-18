import time
import json
from config import db
from fetch.run_scrapers import run_scrapers  # ✅ Importing scrapers
from store.store_jobs import store_jobs  # ✅ Firestore storage logic

def get_subscribed_users():
    """Fetch all users who are actively subscribed."""
    users_ref = db.collection("users").stream()
    return [
        {
            "id": user.id,
            "jobTitles": user.to_dict().get("jobTitles", []),
            "jobLocations": user.to_dict().get("jobLocations", []),
        }
        for user in users_ref if user.to_dict().get("subscribed")  # ✅ Filter active users
    ]

def get_unique_job_titles():
    """Get unique job titles from all subscribed users."""
    users = get_subscribed_users()
    job_titles = set()
    for user in users:
        job_titles.update(user["jobTitles"])
    return list(job_titles)

def get_unique_job_locations():
    """Get unique job locations from all subscribed users."""
    users = get_subscribed_users()
    locations = set()
    for user in users:
        locations.update(user["jobLocations"])
    return list(locations)

def job_cycle():
    """Fetch new jobs for all subscribed users and store them."""
    job_titles = get_unique_job_titles()
    job_locations = get_unique_job_locations()

    if not job_titles:
        print("❌ No active users or job titles found. Skipping scraper.")
        return

    print(f"\n🔄 Fetching jobs for: {job_titles} in {job_locations}")
    jobs = run_scrapers(job_titles, job_locations)  # ✅ Multi-location support

    if not any(jobs.values()):
        print("❌ No jobs found in this cycle.")
        return

    print("✅ Scraping complete. Storing results per user...")

    # ✅ Get subscribed users and distribute jobs accordingly
    users = get_subscribed_users()

    for user in users:
        user_jobs = {}

        for source, job_list in jobs.items():
            user_jobs[source] = [
                job for job in job_list
                if job["title"] in user["jobTitles"]
                and job["location"] in user["jobLocations"]
            ]

        store_jobs(user["id"], user_jobs)  # ✅ Save matched jobs under each user
        print(f"💾 Stored {sum(len(v) for v in user_jobs.values())} jobs for {user['id']}")

if __name__ == "__main__":
    start_time = time.time()
    job_cycle()
    elapsed_time = time.time() - start_time
    print(f"\n🕒 Total time taken: {elapsed_time:.2f} seconds.")