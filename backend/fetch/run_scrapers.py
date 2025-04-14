# fetch/run_scrapers.py

import json
from fetch import ifyoucould, unjobs, workable, linkedin, ziprecruiter  # ✅ Add ZipRecruiter import

def fetch_jobs(job_location_pairs):
    print(f"\n⏳ Running job scrapers for {len(job_location_pairs)} job title + location combinations...")

    jobs = {
        # "linkedin": [],
        "ifyoucould": [],
        # "unjobs": [],
        # "ziprecruiter": [],  # ✅ Add ZipRecruiter key
        # "workable": [],
    }

    # 🔁 Run LinkedIn, UNJobs, ZipRecruiter per search pair
    for job_title, location in job_location_pairs:
        print(f"🔍 Scraping for: '{job_title}' in '{location}'...")

        # jobs["linkedin"].extend(linkedin.fetch_linkedin_jobs(job_title, location))
        # jobs["unjobs"].extend(unjobs.fetch_unjobs_parallel([job_title], [location]))
        # jobs["ziprecruiter"].extend(ziprecruiter.fetch_ziprecruiter_jobs(job_title, location))  # ✅ Add ZipRecruiter

        # jobs["workable"].extend(workable.fetch_workable_jobs([job_title], [location]))

    # ✅ Fetch all IfYouCould jobs ONCE
    print("📥 Collecting all If You Could jobs in one scrape...")
    all_ifyoucould_jobs = ifyoucould.fetch_ifyoucould_jobs()

    # 🔍 Now filter them for each job-location pair
    for job_title, location in job_location_pairs:
        for job in all_ifyoucould_jobs:
            if job_title.lower() in job["title"].lower() and location.lower() in job["location"].lower():
                jobs["ifyoucould"].append(job)

    # Summary
    total_jobs = sum(len(jobs[source]) for source in jobs)
    print(f"✅ Completed scraping. Found {total_jobs} total jobs:")
    for source, job_list in jobs.items():
        print(f"  - {source}: {len(job_list)} jobs")

    return jobs

def run_scrapers(job_location_pairs):
    return fetch_jobs(job_location_pairs)
