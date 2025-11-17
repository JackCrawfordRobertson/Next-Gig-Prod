# fetch/run_scrapers.py

import json
from fetch import ifyoucould, unjobs, workable, linkedin, ziprecruiter, glassdoor

def fetch_jobs(job_location_pairs):
    print(f"\n⏳ Running job scrapers for {len(job_location_pairs)} job title + location combinations...")

    jobs = {
        "linkedin": [],
        "ifyoucould": [],
        "unjobs": [],
        "glassdoor": [],
        # "ziprecruiter": [],
        # "workable": [],
    }

    # 🔁 Run LinkedIn, UNJobs per search pair
    for job_title, location in job_location_pairs:
        print(f"🔍 Scraping for: '{job_title}' in '{location}'...")

        # Fetch and validate LinkedIn jobs
        linkedin_results = linkedin.fetch_linkedin_jobs(job_title, location)
        for job in linkedin_results:
            if job.get('source') != 'linkedin':
                print(f"⚠️ LinkedIn job missing correct source: {job.get('title')}")
                job['source'] = 'linkedin'
        jobs["linkedin"].extend(linkedin_results)
        
        # Fetch and validate UN jobs
        un_results = unjobs.fetch_unjobs_parallel([job_title], [location])
        for job in un_results:
            if job.get('source') != 'unjobs':
                print(f"⚠️ UN job missing correct source: {job.get('title')}")
                job['source'] = 'unjobs'
        jobs["unjobs"].extend(un_results)

        # # Temporarily disabled: Glassdoor is blocking requests and HTML parsing is unreliable
        # # TODO: Investigate alternative Glassdoor API or scraping method
        # gd_results = glassdoor.fetch_glassdoor_jobs([job_title], [location])
        # for job in gd_results:
        #     if job.get('source') != 'glassdoor':
        #         print(f"⚠️ Glassdoor job missing correct source: {job.get('title')}")
        #         job['source'] = 'glassdoor'
        # jobs["glassdoor"].extend(gd_results)

        # # Uncomment to enable ZipRecruiter
        # zip_results = ziprecruiter.fetch_ziprecruiter_jobs(job_title, location)
        # for job in zip_results:
        #     if job.get('source') != 'ziprecruiter':
        #         print(f"⚠️ ZipRecruiter job missing correct source: {job.get('title')}")
        #         job['source'] = 'ziprecruiter'
        # jobs["ziprecruiter"].extend(zip_results)

        # # Uncomment to enable Workable
        # workable_results = workable.fetch_workable_jobs([job_title], [location])
        # for job in workable_results:
        #     if job.get('source') != 'workable':
        #         print(f"⚠️ Workable job missing correct source: {job.get('title')}")
        #         job['source'] = 'workable'
        # jobs["workable"].extend(workable_results)

    # ✅ Fetch all IfYouCould jobs ONCE
    print("📥 Collecting all If You Could jobs in one scrape...")
    all_ifyoucould_jobs = ifyoucould.fetch_ifyoucould_jobs()

    # 🔍 Filter and ensure source is set
    for job_title, location in job_location_pairs:
        for job in all_ifyoucould_jobs:
            if job_title.lower() in job["title"].lower() and location.lower() in job["location"].lower():
                job['source'] = 'ifyoucould'  # Ensure source is set
                jobs["ifyoucould"].append(job)

    # Summary with validation
    total_jobs = sum(len(jobs[source]) for source in jobs)
    print(f"✅ Completed scraping. Found {total_jobs} total jobs:")
    for source, job_list in jobs.items():
        print(f"  - {source}: {len(job_list)} jobs")
        # Validate all jobs have correct source
        mismatched = [j for j in job_list if j.get('source') != source]
        if mismatched:
            print(f"    ⚠️ WARNING: {len(mismatched)} jobs have incorrect source!")

    return jobs

def run_scrapers(job_location_pairs):
    return fetch_jobs(job_location_pairs)