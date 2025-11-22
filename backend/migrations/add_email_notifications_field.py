"""
Database Migration Script: Add emailNotificationsEnabled field to existing users

This script adds the emailNotificationsEnabled field (default: true) to all existing
users in the Firestore database who don't already have this field.

Usage:
    python migrations/add_email_notifications_field.py

Features:
    - Only updates users that don't have the field (idempotent)
    - Shows progress with emoji indicators
    - Provides detailed summary of changes
    - Safe to run multiple times
"""

import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")

if not FIREBASE_CREDENTIALS_PATH:
    raise ValueError("Missing FIREBASE_CREDENTIALS_PATH in environment variables. Please set it in the .env file.")

# Initialize Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def add_email_notifications_field():
    """
    Add emailNotificationsEnabled field to all users who don't have it.
    Default value: true (users opt-in by default)
    """
    print("🚀 Starting database migration: Adding emailNotificationsEnabled field\n")

    users_ref = db.collection("users")
    all_users = users_ref.stream()

    total_users = 0
    users_updated = 0
    users_skipped = 0
    errors = 0

    for user in all_users:
        total_users += 1
        user_data = user.to_dict()
        user_email = user_data.get("email", "Unknown")

        # Check if field already exists
        if "emailNotificationsEnabled" in user_data:
            print(f"⏭️  Skipping {user_email} - field already exists (value: {user_data['emailNotificationsEnabled']})")
            users_skipped += 1
            continue

        # Add the field with default value true
        try:
            users_ref.document(user.id).update({
                "emailNotificationsEnabled": True
            })
            print(f"✅ Updated {user_email} - emailNotificationsEnabled set to true")
            users_updated += 1
        except Exception as e:
            print(f"❌ Error updating {user_email}: {e}")
            errors += 1

    # Print summary
    print("\n" + "="*60)
    print("📊 Migration Summary")
    print("="*60)
    print(f"Total Users Processed:     {total_users}")
    print(f"✅ Users Updated:          {users_updated}")
    print(f"⏭️  Users Skipped:          {users_skipped} (already had field)")
    print(f"❌ Errors:                 {errors}")
    print("="*60)

    if errors == 0:
        print("\n🎉 Migration completed successfully!")
    else:
        print(f"\n⚠️  Migration completed with {errors} error(s)")

    return {
        "total": total_users,
        "updated": users_updated,
        "skipped": users_skipped,
        "errors": errors
    }

def verify_migration():
    """
    Verify that all users now have the emailNotificationsEnabled field.
    """
    print("\n🔍 Verifying migration...\n")

    users_ref = db.collection("users")
    all_users = users_ref.stream()

    total_users = 0
    users_with_field = 0
    users_without_field = 0

    for user in all_users:
        total_users += 1
        user_data = user.to_dict()
        user_email = user_data.get("email", "Unknown")

        if "emailNotificationsEnabled" in user_data:
            users_with_field += 1
        else:
            users_without_field += 1
            print(f"⚠️  {user_email} - MISSING emailNotificationsEnabled field")

    print("\n" + "="*60)
    print("🔍 Verification Results")
    print("="*60)
    print(f"Total Users:                {total_users}")
    print(f"✅ Users WITH field:        {users_with_field}")
    print(f"❌ Users WITHOUT field:     {users_without_field}")
    print("="*60)

    if users_without_field == 0:
        print("\n✅ All users have emailNotificationsEnabled field!")
    else:
        print(f"\n⚠️  {users_without_field} user(s) still missing the field")

    return users_without_field == 0

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   DATABASE MIGRATION: Add Email Notifications Field         ║
║                                                              ║
║   This will add 'emailNotificationsEnabled: true' to all    ║
║   existing users who don't already have this field.         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """)

    # Run migration
    result = add_email_notifications_field()

    # Verify migration
    if result["updated"] > 0 or result["errors"] > 0:
        verification_passed = verify_migration()

        if verification_passed:
            print("\n✅ Migration and verification complete!")
        else:
            print("\n⚠️  Some users may still be missing the field. Check logs above.")
    else:
        print("\n✅ No updates needed - all users already have the field!")
