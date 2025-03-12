import json
from fetch import ifyoucould, unjobs, workable, linkedin

def fetch_jobs(job_titles, location):
    """Fetch job listings dynamically based on user input."""
    print(f"\n⏳ Running job scrapers for {job_titles} in {location}...")

    jobs = {
        "linkedin": linkedin.fetch_all_linkedin_jobs(job_titles, location),
        "ifyoucould": ifyoucould.fetch_ifyoucould_jobs(job_titles, location),
        "unjobs": unjobs.fetch_unjobs(job_titles, location),
        "workable": workable.fetch_workable_jobs(job_titles, location),
    }

    return jobs  # ✅ Returning jobs dynamically

def run_scrapers(job_titles, location):
    """Run all scrapers based on user input."""
    return fetch_jobs(job_titles, location)  # ✅ Now uses user preferences