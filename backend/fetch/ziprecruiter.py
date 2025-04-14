import time
import shutil
import os
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

EXCLUDED_KEYWORDS = ["video", "social media"]

def fetch_ziprecruiter_jobs(search_term, location, max_jobs=50):
    """
    Uses headless Chrome to scrape job listings from ZipRecruiter UK.
    """
    url = f"https://www.ziprecruiter.co.uk/jobs/search?q={search_term.replace(' ', '+')}&l={location.replace(' ', '+')}"
    print(f"🌍 Launching headless browser for: {url}")

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

    chrome_path = shutil.which("chromedriver") or "/usr/bin/chromedriver"
    if not os.path.exists(chrome_path):
        raise FileNotFoundError("Chromedriver not found. Please install in CI environment.")

    driver = webdriver.Chrome(options=chrome_options)
    driver.get(url)

    try:
        # Wait for the job titles to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CLASS_NAME, "jobList-title"))
        )
        time.sleep(2)  # extra buffer for JS to finish
    except Exception as e:
        print("⚠️ Page took too long to load or is blocked.")
        driver.quit()
        return []

    html = driver.page_source
    driver.quit()

    return parse_ziprecruiter_html(html, max_jobs)


def parse_ziprecruiter_html(html, max_jobs):
    """
    Extracts jobs from the UK ZipRecruiter page.
    """
    soup = BeautifulSoup(html, "html.parser")
    jobs = []
    seen_titles = set()

    job_links = soup.find_all("a", class_="jobList-title zip-backfill-link")
    for link in job_links:
        title_tag = link.find("strong")
        title = title_tag.get_text(strip=True) if title_tag else link.get_text(strip=True)
        job_url = link["href"]

        if title in seen_titles:
            continue
        seen_titles.add(title)

        parent = link.find_parent()

        meta = parent.find_next("ul", class_="jobList-introMeta")
        company, location = "N/A", "N/A"
        if meta:
            meta_items = meta.find_all("li")
            if len(meta_items) > 0:
                company = meta_items[0].get_text(strip=True)
            if len(meta_items) > 1:
                location = meta_items[1].get_text(strip=True)

        salary_tag = parent.find_next("div", class_="jobList-salary")
        salary = salary_tag.get_text(strip=True) if salary_tag else "Not Provided"

        date_tag = parent.find_next("div", class_="jobList-date")
        date_posted = date_tag.get_text(strip=True) if date_tag else "N/A"

        if any(word.lower() in title.lower() or word.lower() in company.lower() for word in EXCLUDED_KEYWORDS):
            continue

        jobs.append({
            "title": title,
            "company": company,
            "location": location,
            "url": job_url,
            "salary": salary,
            "date_posted": date_posted,
        })

        if len(jobs) >= max_jobs:
            break

    print(f"✅ Parsed {len(jobs)} job(s) from UK layout.")
    return jobs
