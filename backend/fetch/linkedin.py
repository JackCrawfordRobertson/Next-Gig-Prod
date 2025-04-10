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

DATE_THRESHOLD = datetime.today() - timedelta(days=14) 

def parse_relative_date(date_text):
    today = datetime.today()

    if "week ago" in date_text or "weeks ago" in date_text:
        weeks = int(date_text.split()[0])
        return today - timedelta(weeks=weeks)

    if "month ago" in date_text or "months ago" in date_text:
        months = int(date_text.split()[0])
        return today - timedelta(weeks=4 * months)

    return today 

def fetch_all_linkedin_jobs(job_titles, locations, max_jobs=20, max_per_title=10):
    """
    Fetches LinkedIn job listings for dynamically provided job titles and locations.
    Limits to max_per_title per job role and max_jobs per keyword.
    
    :param job_titles: List of job titles to search for
    :param locations: List or string of locations to search in
    :param max_jobs: Maximum jobs to retrieve per job title (default: 20)
    :param max_per_title: Maximum identical job titles to include (default: 10)
    :return: List of job dictionaries
    """
    all_jobs = []
    total_api_calls = 0
    start_time = time.time()

    if not isinstance(locations, list):
        locations = [locations]

    print(f"🔍 Starting LinkedIn job search for {len(job_titles)} job titles across {len(locations)} locations")
    print(f"🎯 Target: Up to {max_jobs} jobs per title-location combination")

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

            total_api_calls += (len(jobs) // 25) + 1  # Estimate API calls

            if jobs:
                print(f"✅ Found {len(jobs)} jobs for {job_title} in {location}")
                all_jobs.extend(jobs)
            else:
                print(f"❌ No jobs found for {job_title} in {location}")

    # Add statistics at the end
    elapsed_time = time.time() - start_time
    print(f"\n📊 LINKEDIN SCRAPER STATISTICS:")
    print(f"✅ Total jobs found: {len(all_jobs)}")
    print(f"🔍 Total search combinations: {len(job_titles) * len(locations)}")
    print(f"📡 Estimated API calls: {total_api_calls}")
    print(f"⏱️ Total time: {elapsed_time:.2f} seconds")
    print(f"⚡ Rate: {len(all_jobs)/elapsed_time:.2f} jobs/second")

    return all_jobs

def fetch_linkedin_jobs(search_term, location, max_jobs=20, max_per_title=10):
    """
    Fetches LinkedIn job listings for a specific job title and location.
    
    :param search_term: Job title to search for
    :param location: Location to search in
    :param max_jobs: Maximum jobs to retrieve (default: 20)
    :param max_per_title: Maximum identical job titles to include (default: 10)
    :return: List of job dictionaries
    """
    jobs = []
    start = 0  # LinkedIn paginates results (increments of 25)
    seen_job_ids = set()
    job_title_counts = {}  # Track count per job title
    page_count = 0
    max_pages = 3  # Limit to reasonable number of pages (8 pages = 200 potential listings)

    print(f"🔎 Searching for: {search_term} in {location}")

    while len(jobs) < max_jobs and start < 1000 and page_count < max_pages:
        page_count += 1
        
        # Create URL with pagination
        url = (
            f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?"
            f"keywords={search_term.replace(' ', '%20')}&location={location.replace(' ', '%20')}"
            f"&start={start}&sort=R"  # Sort by relevance
        )

        # Add randomized delay to avoid rate limiting
        time.sleep(random.uniform(2.0, 4.0))
        
        try:
            print(f"📄 Fetching page {page_count} (results {start}-{start+25})...")
            response = requests.get(url, headers=HEADERS, timeout=15)
            
            if response.status_code == 429:
                print(f"⚠️ Rate limited! Waiting longer before retry...")
                time.sleep(random.uniform(30, 60))  # Longer wait on rate limit
                response = requests.get(url, headers=HEADERS, timeout=15)
            
            if response.status_code != 200:
                print(f"❌ LinkedIn request failed: {response.status_code}")
                break

            soup = BeautifulSoup(response.text, "html.parser")
            job_cards = soup.find_all("div", class_="base-search-card")

            if not job_cards:
                print(f"📭 No more job listings found on page {page_count}.")
                break
                
            print(f"📑 Found {len(job_cards)} job cards on page {page_count}")

            for job_card in job_cards:
                if len(jobs) >= max_jobs:
                    print(f"🛑 Reached maximum of {max_jobs} jobs for this search")
                    break

                # Extract Job URL
                href_tag = job_card.find("a", class_="base-card__full-link")
                if not href_tag or "href" not in href_tag.attrs:
                    continue
                job_url = href_tag["href"].split("?")[0]

                # Extract Job ID to avoid duplicates
                job_id = job_url.split("-")[-1]
                if job_id in seen_job_ids:
                    continue
                seen_job_ids.add(job_id)

                # Extract Job Title
                title_tag = job_card.find("span", class_="sr-only")
                title = title_tag.get_text(strip=True) if title_tag else "N/A"

                # Extract Company Name
                company_tag = job_card.find("h4", class_="base-search-card__subtitle")
                company_name = company_tag.get_text(strip=True) if company_tag else "N/A"

                # Extract Location
                location_tag = job_card.find("span", class_="job-search-card__location")
                job_location = location_tag.get_text(strip=True) if location_tag else "N/A"

                # Extract Salary (if available)
                salary_tag = job_card.find("span", class_="job-search-card__salary-info")
                salary = salary_tag.get_text(strip=True) if salary_tag else "Not Provided"

                # Extract & Validate Job Posting Date
                date_tag = job_card.find("time", class_="job-search-card__listdate")
                job_date = datetime.today()

                if date_tag:
                    if date_tag.has_attr("datetime"):
                        job_date = datetime.strptime(date_tag["datetime"], "%Y-%m-%d")
                    else:
                        relative_date_text = date_tag.get_text(strip=True).lower()
                        job_date = parse_relative_date(relative_date_text)

                    if job_date < DATE_THRESHOLD:
                        print(f"⏳ Skipping old job: {title} (Posted {job_date.date()})")
                        continue

                # Limit identical job titles
                if job_title_counts.get(title, 0) >= max_per_title:
                    continue

                # Job passed all filters - add to results
                jobs.append({
                    "title": title,
                    "company": company_name,
                    "location": job_location,
                    "url": job_url,
                    "salary": salary,
                    "date_posted": job_date.strftime("%Y-%m-%d"),
                    "date_added": datetime.utcnow().strftime("%Y-%m-%d"),
                    "has_applied": False,
                    "source": "linkedin"
                })

                job_title_counts[title] = job_title_counts.get(title, 0) + 1
                print(f"✅ Added: {title} at {company_name}")

            # If we didn't find any new jobs on this page, break
            if len(jobs) == 0 and page_count > 1:
                print("🔍 No new matching jobs found. Ending search.")
                break

            # Move to next page
            start += 25
            
        except Exception as e:
            print(f"❌ Error processing page {page_count}: {str(e)}")
            break

    print(f"🏁 Completed search for '{search_term}' in {location}")
    print(f"📊 Found {len(jobs)} jobs across {page_count} pages")
    
    return jobs