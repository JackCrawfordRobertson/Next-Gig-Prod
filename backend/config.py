import os
import json
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# ✅ Load environment variables
load_dotenv()

# ✅ Handle Firebase Credentials
firebase_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

if firebase_json:
    try:
        firebase_credentials = json.loads(firebase_json)
        firebase_credentials_path = "/tmp/firebase_credentials.json"
        with open(firebase_credentials_path, "w") as f:
            json.dump(firebase_credentials, f)
    except json.JSONDecodeError:
        raise ValueError("❌ Invalid FIREBASE_CREDENTIALS_JSON format!")
else:
    firebase_credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

if not firebase_credentials_path:
    raise ValueError("❌ FIREBASE_CREDENTIALS_PATH is missing!")

# ✅ Initialize Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_credentials_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def get_subscribed_users():
    """Fetches all users who are subscribed or on trial."""
    users_ref = db.collection("users").stream()
    subscribed_users = []

    for user_doc in users_ref:
        user_data = user_doc.to_dict()
        if user_data.get("status") in ["subscribed", "trial"]:
            subscribed_users.append(user_data)

    return subscribed_users

def get_unique_job_titles():
    """Fetches unique job titles across all subscribed users."""
    users = get_subscribed_users()
    job_titles = set()  # ✅ Using a set to remove duplicates

    for user in users:
        job_titles.update(user.get("jobTitles", []))  # ✅ Add job titles to the set

    return list(job_titles)  # ✅ Convert set back to a list

# ✅ Default Location (Assuming most users are in the UK)
LOCATION = os.getenv("LOCATION", "United Kingdom")