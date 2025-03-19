import sys
import os
import time
import random
import cloudscraper
from bs4 import BeautifulSoup
from datetime import datetime

# ✅ Ensure script finds `config.py`
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import config  # Import job keywords & location

BASE_URL = "https://unjobs.org/search/{query}"  # ✅ Correct search format

# ✅ Filtering rules
EXCLUDED_KEYWORDS = ["senior", "director", "lead", "head"]

# User-Agent Rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.124 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36",
]

def parse_job_location(location):
    """
    Normalize location for more flexible matching.
    Converts to lowercase and handles common variations.
    """
    location = location.lower().strip()
    # Add more location normalization if needed
    replacements = {
        'united kingdom': 'uk',
        'greater london': 'london',
    }
    for full, short in replacements.items():
        location = location.replace(full, short)
    return location

def fetch_unjobs(job_titles=None, locations=None):
    """
    Scrapes job listings from UN Jobs using CloudScraper with flexible matching.
    
    :param job_titles: List of job titles to match against
    :param locations: List of locations to match against
    """
    # Use provided job titles and locations, or default to config
    job_titles = job_titles or config.JOB_KEYWORDS
    locations = locations or ['london', 'remote', 'uk']

    print("🔍 Scraping UN Jobs...")

    scraper = cloudscraper.create_scraper()  # ✅ Bypasses Cloudflare
    headers = {"User-Agent": random.choice(USER_AGENTS)}

    all_jobs = []

    for job_keyword in job_titles:
        query = job_keyword.lower().replace(" ", "-")  
        search_url = BASE_URL.format(query=query)  
        print(f"\n🌍 Searching for '{job_keyword}' → {search_url}")

        visited_pages = set()  # ✅ Track visited pages to avoid loops
        current_page = search_url

        while current_page:
            if current_page in visited_pages:
                print(f"⚠️ Loop detected! Already visited {current_page}. Stopping pagination.")
                break  # ✅ Stop if we are looping
            visited_pages.add(current_page)

            print(f"🔄 Fetching page: {current_page}")
            response = scraper.get(current_page, headers=headers)

            if response.status_code == 403:
                print("❌ Forbidden (403). Adding delay and retrying...")
                time.sleep(random.randint(5, 10))  # 🔄 Add a longer delay
                response = scraper.get(current_page, headers=headers)

                if response.status_code == 403:
                    print("❌ Still Forbidden. Skipping this search term.")
                    break

            soup = BeautifulSoup(response.text, "html.parser")

            job_elements = soup.select("a.jtitle")  # Finds job titles & links

            print(f"📌 Found {len(job_elements)} job elements for '{job_keyword}'.")

            for job_element in job_elements:
                title = job_element.text.strip()
                url = job_element["href"]

                if not url.startswith("https://"):
                    url = "https://unjobs.org" + url  

                if any(keyword.lower() in title.lower() for keyword in EXCLUDED_KEYWORDS):
                    print(f"⚠️ Skipping senior role: {title}")
                    continue

                title_match = any(
                    search_title.lower() in title.lower() 
                    for search_title in job_titles
                )

                location_match = any(
                    search_loc.lower() in title.lower() 
                    for search_loc in locations
                )

                if title_match and location_match:
                    print(f"🆕 Job Found: {title}")
                    print(f"🔗 Job Link: {url}")

                    all_jobs.append({
                        "title": title,
                        "company": "UN Jobs",
                        "location": "London",  # Default location as original script
                        "url": url,
                        "date_added": datetime.utcnow().strftime("%Y-%m-%d"),
                        "has_applied": False,
                    })
                else:
                    print(f"❌ Job Skipped: {title}")

            next_button = soup.select_one("a.ts")
            if next_button:
                next_url = next_button["href"]

                # ✅ Fix the issue where the base URL is already included
                if not next_url.startswith("https://"):
                    next_url = "https://unjobs.org" + next_url

                if next_url in visited_pages:
                    print("⚠️ Pagination Loop Detected. Stopping.")
                    break  # ✅ Stop if we are looping

                print(f"➡️ Clicking 'Next' to load more jobs... → {next_url}")
                current_page = next_url
                time.sleep(random.randint(5, 10))  # ✅ Random delay to prevent rate-limiting
            else:
                print(f"✅ No more pages for '{job_keyword}'. Moving to next search.")
                break  # Stop loop if no more pages

    print("\n🔍 FINAL JOB LISTINGS:")
    for job in all_jobs:
        print(f"📝 {job['title']}")
        print(f"🏢 {job['company']}")
        print(f"📍 {job['location']}")
        print(f"🔗 {job['url']}")
        print("-" * 50)  # Separator for readability

    print(f"✅ Finished scraping UN Jobs. Total jobs found: {len(all_jobs)}")
    return all_jobs

if __name__ == "__main__":
    # Example of running with specific job titles and locations
    jobs = fetch_unjobs(
        job_titles=['Frontend Engineer', 'UX Designer'],
        locations=['London', 'Remote']
    )
    
    # Print out matched jobs for verification
    for job in jobs:
        print(job)