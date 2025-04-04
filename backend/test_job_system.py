# test_job_system.py
import time
from main import quick_test, job_cycle, cleanup_test_user
from store.store_jobs import store_jobs
from config import db

def test_full_system():
    print("🧪 TESTING JOB SYSTEM")
    print("=" * 50)
    
    # 1. Create test user and run first scrape
    print("\n1️⃣ First job scrape cycle")
    quick_test()
    
    # 2. Count jobs after first scrape
    test_user = next(db.collection("users").where("email", "==", "test_user@nexgig.com").stream())
    user_id = test_user.id
    jobs_after_first = list(db.collection("users").document(user_id).collection("jobs").stream())
    first_count = len(jobs_after_first)
    
    print(f"\nFound {first_count} jobs after first scrape")
    
    # 3. Run second scrape (should find mostly duplicates)
    print("\n2️⃣ Second job scrape cycle (testing deduplication)")
    quick_test()
    
    # 4. Count jobs after second scrape
    jobs_after_second = list(db.collection("users").document(user_id).collection("jobs").stream())
    second_count = len(jobs_after_second)
    
    print(f"\nFound {second_count} jobs after second scrape")
    print(f"New jobs added: {second_count - first_count}")
    
    # 5. Manually add a test job with known data
    print("\n3️⃣ Testing manual job addition")
    test_jobs = {
        "manual_test": [{
            "title": "Test Engineer " + str(int(time.time())),
            "company": "Test Company",
            "location": "London",
            "url": f"https://example.com/job/{int(time.time())}",
        }]
    }
    
    new_jobs, dupes = store_jobs(user_id, test_jobs)
    print(f"Manual addition: {new_jobs} new, {dupes} duplicates")
    
    # 6. Clean up
    print("\n4️⃣ Cleaning up test data")
    cleanup_test_user()
    print("Test complete!")

if __name__ == "__main__":
    test_full_system()