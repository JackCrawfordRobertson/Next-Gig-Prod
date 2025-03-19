# ifyoucould.py

import sys
import os
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))  # Go up one level
import config  # Import the config file

BASE_URL = "https://www.ifyoucouldjobs.com/jobs"
MAX_PAGES = 2  # Scrape first 2 pages

EXCLUDED_KEYWORDS = ["senior", "director", "lead", "head"]

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

def fetch_ifyoucould_jobs(job_titles=None, locations=None):
    """
    Scrapes job listings from If You Could Jobs using Selenium with flexible keyword filtering.
    
    :param job_titles: List of job titles to match against
    :param locations: List of locations to match against
    """
    # Use provided job titles and locations, or default to config
    job_titles = job_titles or config.JOB_KEYWORDS
    locations = locations or ['london', 'remote', 'uk']

    print("🔍 Starting If You Could Jobs Scraper...")

    # ✅ Set up Chrome options
    options = Options()
    options.add_argument("--headless")  # Run in background (Remove for debugging)
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    print("🚀 Launching Chrome Browser...")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    jobs = []

    for page in range(1, MAX_PAGES + 1):
        url = f"{BASE_URL}?page={page}"
        print(f"🌍 Navigating to {url} (Page {page})")
        driver.get(url)
        time.sleep(5)  # Wait for page to load

        if page == 1:
            try:
                print("🍪 Checking for cookie popup...")
                cookie_button = driver.find_element(By.ID, "CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll")
                cookie_button.click()
                print("✅ Cookie popup dismissed!")
                time.sleep(2)  # Wait after clicking
            except Exception:
                print("⚠️ No cookie popup found or already dismissed.")

        print("🔍 Searching for job elements...")
        job_elements = driver.find_elements(By.CSS_SELECTOR, "article.bg-warm-grey, article.bg-light-peach")
        print(f"📌 Found {len(job_elements)} job elements on Page {page}.")

        for job in job_elements:
            try:
                title_element = job.find_elements(By.CSS_SELECTOR, "h2.type-style-3")
                title = title_element[0].text.strip() if title_element else None
                if not title:
                    print("⚠️ Skipping job due to missing title")
                    continue

                if any(keyword.lower() in title.lower() for keyword in EXCLUDED_KEYWORDS):
                    print(f"⚠️ Skipping senior role: {title}")
                    continue

                company_element = job.find_elements(By.CSS_SELECTOR, "h3.type-style-4")
                company = company_element[0].text.strip() if company_element else "Unknown"

                location_element = job.find_elements(By.XPATH, ".//dt[contains(text(), 'Location')]/following-sibling::dd")
                job_location = location_element[0].text.strip() if location_element else "Unknown"

                salary_element = job.find_elements(By.XPATH, ".//dt[contains(text(), 'Salary')]/following-sibling::dd")
                salary = salary_element[0].text.strip() if salary_element else "Not listed"

                link_element = job.find_element(By.CSS_SELECTOR, "a.link-reset")
                relative_link = link_element.get_attribute("href")
                full_link = f"https://www.ifyoucouldjobs.com{relative_link}" if relative_link.startswith("/") else relative_link

                title_match = any(
                    search_title.lower() in title.lower() 
                    for search_title in job_titles
                )

                location_match = any(
                    search_loc.lower() in parse_job_location(job_location) 
                    for search_loc in locations
                )

                if title_match and location_match:
                    print(f"🆕 Job Matched: {title} at {company} ({job_location}) - {salary}")
                    print(f"🔗 Job Link: {full_link}")

                    jobs.append({
                        "title": title,
                        "company": company,
                        "location": job_location,
                        "salary": salary,
                        "url": full_link,
                        "date_added": datetime.utcnow().strftime("%Y-%m-%d"),
                        "has_applied": False,
                    })
                else:
                    print(f"❌ Job Skipped: {title} in {job_location}")

            except Exception as e:
                print(f"⚠️ Skipping a job due to error: {e}")
                continue  # Skip if any element is missing

    driver.quit()
    print(f"✅ Finished scraping. Total jobs found: {len(jobs)}")
    return jobs

# Run Scraper for Debugging
if __name__ == "__main__":
    # Example of running with specific job titles and locations
    jobs = fetch_ifyoucould_jobs(
        job_titles=['Frontend Engineer', 'UX Designer'],
        locations=['London', 'Remote']
    )
    
    # Print out matched jobs for verification
    for job in jobs:
        print(job)