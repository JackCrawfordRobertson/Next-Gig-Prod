import firebase_admin
from firebase_admin import firestore

db = firestore.client()

def store_jobs(user_id, jobs):
    """
    Store a dictionary of { sourceName: [jobObjects] } in Firestore for the user.
    """
    user_ref = db.collection("users").document(user_id)
    # Put them in a 'jobs' field or a subcollection. Example below uses a field:
    user_ref.update({"jobs": jobs})
    print(f"✅ Stored {sum(len(lst) for lst in jobs.values())} jobs for {user_id}")