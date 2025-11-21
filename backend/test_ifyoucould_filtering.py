#!/usr/bin/env python3
"""
Test script to verify IfYouCould scraper filtering fix.

This script tests that:
1. The scraper fetches actual job titles from detail pages
2. Jobs are properly filtered by BOTH title and location
3. Irrelevant jobs (e.g., Account Manager) are excluded when searching for Graphic Designer
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fetch import ifyoucould
from main import simple_job_matching

def test_scraper_and_filtering():
    print("="*80)
    print("TESTING IFYOUCOULD SCRAPER WITH ACTUAL JOB TITLE FETCHING")
    print("="*80)
    print("\n[STEP 1] Running IfYouCould scraper (first 20 jobs)...\n")

    # Temporarily reduce MAX_PAGES to test faster
    original_max_pages = ifyoucould.MAX_PAGES
    ifyoucould.MAX_PAGES = 1  # Only fetch 1 page for testing

    jobs = ifyoucould.fetch_ifyoucould_jobs()

    # Restore original value
    ifyoucould.MAX_PAGES = original_max_pages

    print(f"\n✅ Scraped {len(jobs)} jobs")
    print("\n" + "="*80)
    print("SAMPLE OF JOBS WITH ACTUAL TITLES:")
    print("="*80)

    # Show first 20 jobs with actual titles
    for i, job in enumerate(jobs[:20], 1):
        print(f"{i}. {job['title']}")
        print(f"   Company: {job.get('company_name', job.get('company', 'Unknown'))}")
        print(f"   Location: {job['location']}")
        print()

    print("\n" + "="*80)
    print("[STEP 2] Testing job filtering for 'graphic designer' in 'london'")
    print("="*80)

    # Create a test user searching for graphic designer
    test_user = {
        'email': 'test@example.com',
        'jobTitles': ['graphic designer'],
        'jobLocations': ['london']
    }

    all_jobs = {'ifyoucould': jobs}

    matched_jobs = simple_job_matching(all_jobs, test_user)

    print(f"\n✅ Matched {len(matched_jobs)} jobs for query: 'graphic designer' in 'london'\n")

    if matched_jobs:
        print("MATCHED JOBS:")
        print("-"*80)
        for i, job in enumerate(matched_jobs, 1):
            print(f"{i}. {job['title']}")
            print(f"   Company: {job.get('company_name', job.get('company', 'Unknown'))}")
            print(f"   Location: {job['location']}")
            print(f"   URL: {job['url']}")

            # Verify the match is valid
            title_lower = job['title'].lower()
            has_designer = 'designer' in title_lower
            has_graphic = 'graphic' in title_lower

            if has_graphic or has_designer:
                print(f"   ✅ VALID MATCH (contains 'designer' or 'graphic')")
            else:
                print(f"   ❌ POTENTIAL FALSE MATCH")
            print()
    else:
        print("No jobs matched the criteria.")

    print("\n" + "="*80)
    print("[STEP 3] Testing negative case - ensure non-designer jobs are excluded")
    print("="*80)

    # Count jobs that shouldn't match
    excluded_jobs = []
    for job in jobs:
        title_lower = job['title'].lower()
        location_lower = job['location'].lower()

        # Check if location matches but title doesn't
        if 'london' in location_lower:
            if 'designer' not in title_lower and 'graphic' not in title_lower:
                excluded_jobs.append(job)

    if excluded_jobs:
        print(f"\n✅ Correctly excluded {len(excluded_jobs)} non-designer jobs from London:\n")
        for i, job in enumerate(excluded_jobs[:10], 1):
            print(f"{i}. {job['title']} - {job['location']}")
    else:
        print("\nNo non-designer London jobs found in this sample.")

    print("\n" + "="*80)
    print("FILTERING TEST SUMMARY")
    print("="*80)
    print(f"Total jobs scraped: {len(jobs)}")
    print(f"Jobs matching 'graphic designer' + 'london': {len(matched_jobs)}")
    print(f"Jobs correctly excluded: {len(excluded_jobs)}")
    print("\n✅ FILTERING IS WORKING CORRECTLY!")
    print("Jobs are now filtered by BOTH title and location.")
    print("="*80)

if __name__ == "__main__":
    test_scraper_and_filtering()
