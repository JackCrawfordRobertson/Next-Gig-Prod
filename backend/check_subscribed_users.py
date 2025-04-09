import sys
from config import db

def check_subscribed_users():
    users_ref = db.collection("users").where("subscribed", "==", True).stream()
    users = list(users_ref)
    if not users:
        print("No subscribed users found. Exiting.")
        sys.exit(1)  # Non-zero exit to abort GitHub Action
    print(f"Found {len(users)} subscribed users. Proceeding with job scraping.")
    sys.exit(0)  # Zero exit to continue GitHub Action

if __name__ == "__main__":
    check_subscribed_users()