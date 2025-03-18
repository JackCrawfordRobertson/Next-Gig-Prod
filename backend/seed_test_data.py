import firebase_admin
from firebase_admin import firestore, credentials
import config  # ✅ Ensures Firebase is initialized from .env

db = firestore.client()

def seed_users_and_jobs():
    """
    Adds test users to Firestore's 'users' collection
    and attaches mock job data for testing frontend display.
    """

    # 1) ✅ Define test users
    user_data = [
        {
            "id": "user_001",
            "email": "alice@example.com",
            "subscribed": True,
            "jobTitles": ["Junior Developer", "Product Designer"],
            "jobLocations": ["London", "Remote"],
        },
        {
            "id": "user_002",
            "email": "bob@example.com",
            "subscribed": True,
            "jobTitles": ["Data Analyst", "Data Journalist"],
            "jobLocations": ["Manchester"],
        },
        {
            "id": "user_003",
            "email": "charlie@example.com",
            "subscribed": True,
            "jobTitles": ["Frontend Engineer", "UX Designer"],
            "jobLocations": ["London"],
        },
        {
            "id": "user_004",
            "email": "david@example.com",
            "subscribed": False,  # Unsubscribed user (should be ignored)
            "jobTitles": ["Backend Developer"],
            "jobLocations": ["Birmingham"],
        }
    ]

    # 2) ✅ Store test users
    for user in user_data:
        doc_ref = db.collection("users").document(user["id"])
        doc_ref.set({
            "email": user["email"],
            "subscribed": user["subscribed"],
            "jobTitles": user["jobTitles"],
            "jobLocations": user["jobLocations"],
        })
        print(f"✅ Created/updated user {user['id']}")

    # 3) ✅ Add mock job postings
    test_jobs = {
        "linkedin": [
            {
                "title": "Junior Developer",
                "company": "Acme Corp",
                "location": "London",
                "url": "https://example.com/job/acme/junior-dev",
            },
            {
                "title": "Product Designer",
                "company": "DesignCo",
                "location": "Remote",
                "url": "https://example.com/job/designco/product-designer",
            },
        ],
        "workable": [
            {
                "title": "Data Analyst",
                "company": "Analytics Ltd",
                "location": "Manchester",
                "url": "https://example.com/job/analytics/data-analyst",
            }
        ],
        "ifyoucould": [
            {
                "title": "Frontend Engineer",
                "company": "Creative Devs",
                "location": "London",
                "url": "https://example.com/job/creativedevs/frontend-engineer",
            }
        ],
        "unjobs": []
    }

    # ✅ Attach jobs to multiple users (only subscribed ones)
    for user in user_data:
        if user["subscribed"]:
            user_ref = db.collection("users").document(user["id"])
            user_ref.update({"jobs": test_jobs})
            print(f"✅ Attached test jobs to {user['id']}")

    print("\n✅ Test data seeding complete!")


if __name__ == "__main__":
    seed_users_and_jobs()