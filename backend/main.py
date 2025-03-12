import time
import json
import firebase_admin
from firebase_admin import credentials, firestore
from fetch.run_scrapers import run_scrapers  # ✅ Importing the scraper
from store.store_jobs import store_jobs  # ✅ Importing Firestore storage logic

# ✅ Initialize Firebase only once
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase-admin-sdk.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

def get_user_preferences(user_id):
    """Fetch user's job preferences (job titles & location) from Firestore."""
    doc_ref = db.collection("users").document(user_id)
    doc = doc_ref.get()

    if doc.exists:
        return doc.to_dict()
    else:
        print(f"❌ No preferences found for user {user_id}")
        return None

def job_cycle(user_id):
    """Fetch new jobs for a specific user and store them in Firestore."""
    user_preferences = get_user_preferences(user_id)

    if not user_preferences:
        print("❌ Skipping job search – No user preferences found.")
        return

    job_titles = user_preferences.get("jobTitles", [])
    location = user_preferences.get("location", "London")  # Default to London

    if not job_titles:
        print(f"❌ Skipping job search for {user_id} – No job titles set.")
        return

    print(f"\n🔄 Fetching jobs for {user_id}: {job_titles} in {location}")
    jobs = run_scrapers(job_titles, location)  # ✅ Now passing user data dynamically

    if any(jobs.values()):
        total_jobs = sum(len(v) for v in jobs.values())
        print(f"💾 Storing {total_jobs} jobs for {user_id} in Firestore...")
        store_jobs(user_id, jobs)  # ✅ Storing under the specific user
    else:
        print("❌ No new jobs found.")

    print("✅ Job check complete.")

if __name__ == "__main__":
    start_time = time.time()

    # ✅ Get all user IDs from Firestore
    users_ref = db.collection("users").stream()
    user_ids = [doc.id for doc in users_ref]

    for user_id in user_ids:
        job_cycle(user_id)  # ✅ Runs scraper for each user

    elapsed_time = time.time() - start_time
    print(f"\n🕒 Total time taken: {elapsed_time:.2f} seconds.")