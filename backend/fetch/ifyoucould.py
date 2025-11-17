import sys
import os
import time
import logging
from datetime import datetime
from bs4 import BeautifulSoup
import requests

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import config

logger = logging.getLogger(__name__)

BASE_URL = "https://www.ifyoucouldjobs.com/jobs"
MAX_PAGES = 5
REQUEST_TIMEOUT = 10
RETRY_ATTEMPTS = 3
RETRY_DELAY = 2

def parse_job_location(location):
    """Normalize job location strings for matching."""
    location = location.lower().strip()
    replacements = {
        'united kingdom': 'uk',
        'greater london': 'london',
    }
    for full, short in replacements.items():
        location = location.replace(full, short)
    return location

def fetch_with_retry(url, headers=None, max_retries=RETRY_ATTEMPTS):
    """
    Fetch a URL with automatic retry logic.

    :param url: URL to fetch
    :param headers: Request headers
    :param max_retries: Maximum number of retry attempts
    :return: Response object or None if all retries fail
    """
    default_headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.ifyoucouldjobs.com/'
    }

    if headers:
        default_headers.update(headers)

    for attempt in range(max_retries):
        try:
            logger.info(f"Fetching {url} (attempt {attempt + 1}/{max_retries})")
            response = requests.get(url, headers=default_headers, timeout=REQUEST_TIMEOUT)

            if response.status_code == 200:
                return response
            elif response.status_code == 429:  # Rate limited
                logger.warning(f"Rate limited (429). Waiting {RETRY_DELAY}s before retry...")
                time.sleep(RETRY_DELAY)
            else:
                logger.warning(f"HTTP {response.status_code} received")
                if attempt < max_retries - 1:
                    time.sleep(RETRY_DELAY)

        except requests.exceptions.Timeout:
            logger.warning(f"Request timeout. Retrying in {RETRY_DELAY}s...")
            time.sleep(RETRY_DELAY)
        except requests.exceptions.RequestException as e:
            logger.warning(f"Request failed: {e}. Retrying in {RETRY_DELAY}s...")
            time.sleep(RETRY_DELAY)

    return None

def parse_job_from_article(article):
    """
    Parse a single job from an article element.

    :param article: BeautifulSoup article element
    :return: Job dictionary or None if parsing fails
    """
    try:
        # Extract job link and title
        link = article.find('a', class_='job-link')
        if not link or not link.get('href'):
            return None

        href = link['href']
        job_url = f"https://www.ifyoucouldjobs.com{href}" if href.startswith('/') else href

        # Job title is in h3 within the article
        title_elem = article.find('h3')
        job_title = title_elem.text.strip() if title_elem else None

        if not job_title:
            return None

        # Company name is in h4
        company_elem = article.find('h4')
        company = company_elem.text.strip() if company_elem else "Unknown"

        # Location and salary are in dl/dt/dd elements
        location = "Unknown"
        salary = "Not listed"

        dl = article.find('dl')
        if dl:
            dts = dl.find_all('dt')
            dds = dl.find_all('dd')

            for dt, dd in zip(dts, dds):
                label = dt.text.strip().lower()
                value = dd.text.strip()

                if 'location' in label:
                    location = value
                elif 'salary' in label:
                    salary = value

        return {
            "title": job_title,
            "company": company,
            "location": location,
            "salary": salary,
            "url": job_url,
            "date_added": datetime.utcnow().strftime("%Y-%m-%d"),
            "has_applied": False,
        }

    except Exception as e:
        logger.warning(f"Error parsing job article: {e}")
        return None

def fetch_ifyoucould_jobs():
    """
    Scrapes all job listings from If You Could Jobs using direct HTTP requests.

    This is a reliable, fast alternative to Selenium that works in CI/CD environments
    without requiring Chrome browser installation.

    :return: List of job dictionaries
    """
    logger.info("📥 Starting If You Could Jobs Scraper (HTTP-based)...")

    all_jobs = []

    for page in range(1, MAX_PAGES + 1):
        # If You Could uses offset-based pagination
        url = BASE_URL if page == 1 else f"{BASE_URL}?offset={(page-1)*20}"

        logger.info(f"🌐 Fetching page {page}: {url}")
        response = fetch_with_retry(url)

        if not response:
            logger.warning(f"⚠️ Failed to fetch page {page} after {RETRY_ATTEMPTS} attempts. Continuing...")
            continue

        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        articles = soup.find_all('article', class_='job-item')

        if not articles:
            logger.info(f"📌 No jobs found on page {page}. Stopping pagination.")
            break

        logger.info(f"📌 Found {len(articles)} jobs on page {page}")

        page_jobs = 0
        for article in articles:
            job = parse_job_from_article(article)
            if job:
                all_jobs.append(job)
                page_jobs += 1

        logger.info(f"✅ Parsed {page_jobs} jobs from page {page}")

        # Be respectful to the server - small delay between pages
        if page < MAX_PAGES:
            time.sleep(1)

    logger.info(f"✅ Finished scraping. Total jobs collected: {len(all_jobs)}")
    return all_jobs