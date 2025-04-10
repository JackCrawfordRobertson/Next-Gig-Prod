import json
from fetch import ifyoucould, unjobs, workable, linkedin

def fetch_jobs(job_titles, locations):
    """Fetch job listings dynamically based on user input."""
    print(f"\n⏳ Running job scrapers for {job_titles} in {locations}...")

    jobs = {
        "linkedin": [],
        "ifyoucould": [],
        "unjobs": [],
        # "workable": [],
    }

    for location in locations:
        print(f"🌍 Scraping jobs in {location}...")

        jobs["linkedin"].extend(linkedin.fetch_all_linkedin_jobs(job_titles, location))
        jobs["ifyoucould"].extend(ifyoucould.fetch_ifyoucould_jobs(job_titles, location))
        jobs["unjobs"].extend(unjobs.fetch_unjobs_parallel(job_titles, location))
        # jobs["workable"].extend(workable.fetch_workable_jobs(job_titles, location))

    return jobs  

def run_scrapers(job_titles, locations):
    """Run all scrapers based on user input."""
    return fetch_jobs(job_titles, locations)  