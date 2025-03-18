import time
import random
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta

# ✅ LinkedIn Request Headers (mimics a browser to avoid detection)
HEADERS = {
    "authority": "www.linkedin.com",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "upgrade-insecure-requests": "1",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

# ✅ Filtering rules
EXCLUDED_KEYWORDS = ["video", "social media", "director", "senior"]  # 🚨 Excludes senior roles
DATE_THRESHOLD = datetime.today() - timedelta(days=14)  # 🚨 Only accept jobs posted in last 14 days

# ✅ Convert relative date ("1 week ago", "3 weeks ago") to actual date
def parse_relative_date(date_text):
    today = datetime.today()

    if "week ago" in date_text or "weeks ago" in date_text:
        weeks = int(date_text.split()[0])
        return today - timedelta(weeks=weeks)

    if "month ago" in date_text or "months ago" in date_text:
        months = int(date_text.split()[0])
        return today - timedelta(weeks=4 * months)

    return today  # Default: If no match, assume today

# ✅ Fetch LinkedIn jobs dynamically
def fetch_all_linkedin_jobs(job_titles, locations, max_jobs=5, max_per_title=5):
    """
    Fetches LinkedIn job listings for dynamically provided job titles and locations.
    Limits to max_per_title per job role and max_jobs per keyword.
    """
    all_jobs = []

    for location in locations:
        print(f"\n🌍 Scraping jobs in {location}...")

        for job_title in job_titles:
            print(f"🔍 Searching LinkedIn for: {job_title} in {location}")

            jobs = fetch_linkedin_jobs(
                search_term=job_title,
                location=location,
                max_jobs=max_jobs,
                max_per_title=max_per_title
            )

            if jobs:
                print(f"✅ Found {len(jobs)} jobs for {job_title} in {location}")
                all_jobs.extend(jobs)
            else:
                print(f"❌ No jobs found for {job_title} in {location}")

    print(f"\n✅ Scraped {len(all_jobs)} total jobs from LinkedIn.")
    return all_jobs

# ✅ Fetch LinkedIn jobs for a single job title and location
def fetch_linkedin_jobs(search_term, location, max_jobs=5, max_per_title=5):
    """
    Fetches LinkedIn job listings for a specific job title and location.
    Limits results to a maximum per job title and keyword.
    Filters out jobs posted more than 14 days ago.
    """
    jobs = []
    start = 0  # LinkedIn paginates results (increments of 25)
    seen_job_ids = set()
    job_title_counts = {}  # ✅ Track count per job title

    while len(jobs) < max_jobs and start < 1000:
        url = (
            f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?"
            f"keywords={search_term.replace(' ', '%20')}&location={location.replace(' ', '%20')}&start={start}"
        )

        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            print(f"❌ LinkedIn request failed: {response.status_code}")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        job_cards = soup.find_all("div", class_="base-search-card")

        if not job_cards:
            print(f"❌ No job listings found for {search_term} in {location}.")
            break

        for job_card in job_cards:
            if len(jobs) >= max_jobs:
                print(f"🚫 Stopping search for {search_term} (max {max_jobs} jobs found)")
                break

            # ✅ Extract Job URL
            href_tag = job_card.find("a", class_="base-card__full-link")
            if not href_tag or "href" not in href_tag.attrs:
                continue
            job_url = href_tag["href"].split("?")[0]

            # ✅ Extract Job ID
            job_id = job_url.split("-")[-1]
            if job_id in seen_job_ids:
                continue
            seen_job_ids.add(job_id)

            # ✅ Extract Job Title
            title_tag = job_card.find("span", class_="sr-only")
            title = title_tag.get_text(strip=True) if title_tag else "N/A"

            # ✅ Extract Company Name
            company_tag = job_card.find("h4", class_="base-search-card__subtitle")
            company_name = company_tag.get_text(strip=True) if company_tag else "N/A"

            # ✅ Extract Location
            location_tag = job_card.find("span", class_="job-search-card__location")
            job_location = location_tag.get_text(strip=True) if location_tag else "N/A"

            # ✅ Extract Salary (if available)
            salary_tag = job_card.find("span", class_="job-search-card__salary-info")
            salary = salary_tag.get_text(strip=True) if salary_tag else "Not Provided"

            # ✅ Extract & Validate Job Posting Date
            date_tag = job_card.find("time", class_="job-search-card__listdate")
            job_date = datetime.today()

            if date_tag:
                if date_tag.has_attr("datetime"):
                    job_date = datetime.strptime(date_tag["datetime"], "%Y-%m-%d")
                else:
                    relative_date_text = date_tag.get_text(strip=True).lower()
                    job_date = parse_relative_date(relative_date_text)

                if job_date < DATE_THRESHOLD:
                    print(f"⏳ Skipping old job: {title} at {company_name} (Posted {job_date.date()})")
                    continue

            # ✅ FILTER OUT SENIOR ROLES
            if any(word.lower() in title.lower() for word in EXCLUDED_KEYWORDS):
                print(f"⚠️ Skipping job: {title} at {company_name} (Filtered out)")
                continue

            # ✅ LIMIT JOBS PER TITLE
            if job_title_counts.get(title, 0) >= max_per_title:
                print(f"⚠️ Skipping extra '{title}' jobs (Already found {max_per_title})")
                continue

            # ✅ Add to job list
            jobs.append({
                "title": title,
                "company": company_name,
                "location": job_location,
                "url": job_url,
                "salary": salary,
                "date_posted": job_date.strftime("%Y-%m-%d"),
                "date_added": datetime.utcnow().strftime("%Y-%m-%d"),
                "has_applied": False,
            })

            job_title_counts[title] = job_title_counts.get(title, 0) + 1

        start += 25  # ✅ Paginate in increments of 25
        time.sleep(random.uniform(3, 6))  # ✅ Avoid detection

    return jobs