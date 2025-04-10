# fetch/ifyoucould.py

import sys
import os
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import config

BASE_URL = "https://www.ifyoucouldjobs.com/jobs"
MAX_PAGES = 2

def parse_job_location(location):
    location = location.lower().strip()
    replacements = {
        'united kingdom': 'uk',
        'greater london': 'london',
    }
    for full, short in replacements.items():
        location = location.replace(full, short)
    return location

def fetch_ifyoucould_jobs():
    """
    Scrapes all job listings from If You Could Jobs (across 2 pages) with no filtering.
    Filtering will now be done in main job cycle.
    """
    print("🔍 Starting If You Could Jobs Scraper...")

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    print("🚀 Launching Chrome Browser...")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    jobs = []

    for page in range(1, MAX_PAGES + 1):
        url = f"{BASE_URL}?page={page}"
        print(f"🌍 Navigating to {url}")
        driver.get(url)
        time.sleep(5)

        if page == 1:
            try:
                cookie_button = driver.find_element(By.ID, "CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll")
                cookie_button.click()
                print("✅ Cookie popup dismissed!")
                time.sleep(2)
            except Exception:
                print("⚠️ No cookie popup found or already dismissed.")

        job_elements = driver.find_elements(By.CSS_SELECTOR, "article.bg-warm-grey, article.bg-light-peach")
        print(f"📌 Found {len(job_elements)} jobs on Page {page}")

        for job in job_elements:
            try:
                title_element = job.find_elements(By.CSS_SELECTOR, "h2.type-style-3")
                title = title_element[0].text.strip() if title_element else None
                if not title:
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

                jobs.append({
                    "title": title,
                    "company": company,
                    "location": job_location,
                    "salary": salary,
                    "url": full_link,
                    "date_added": datetime.utcnow().strftime("%Y-%m-%d"),
                    "has_applied": False,
                })

            except Exception as e:
                print(f"⚠️ Skipping job due to error: {e}")
                continue

    driver.quit()
    print(f"✅ Finished scraping. Total jobs collected: {len(jobs)}")
    return jobs
