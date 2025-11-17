import sys
from config import db

def check_subscribed_users():
    """
    FREE ACCESS MODE: Check if any users exist with job preferences.
    Previously checked for subscribed status, now checks for any users.
    """
    # FREE MODE: Get all users with job preferences instead of checking subscription
    users_ref = db.collection("users").stream()
    users = [
        user for user in users_ref
        if user.to_dict().get("jobTitles") and user.to_dict().get("jobLocations")
    ]

    if not users:
        print("No users with job preferences found. Exiting.")
        sys.exit(1)
    print(f"Found {len(users)} users with job preferences. Proceeding with job scraping (FREE MODE).")
    sys.exit(0)

if __name__ == "__main__":
    check_subscribed_users()