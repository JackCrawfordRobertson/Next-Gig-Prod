import firebase_admin
from firebase_admin import firestore

db = firestore.client()

def store_jobs(user_id, jobs):
    """Store scraped job data in Firestore under the user's account."""
    user_ref = db.collection("users").document(user_id)

    # ✅ Save jobs under users/{userId}/jobs
    user_ref.update({"jobs": jobs})
    print(f"✅ Jobs stored for {user_id}")