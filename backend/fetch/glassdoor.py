import sys
import os
import time
import logging
import re
import json
import random
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from datetime import datetime
from typing import List, Dict, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("glassdoor_scraper.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("GlassdoorScraper")

# Ensure script finds `config.py`
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import config

# Constants - OPTIMIZED FOR SPEED
BASE_URL = "https://www.glassdoor.com/Job/jobs.htm"
SEARCH_URL = "https://www.glassdoor.com/Job/{title}-jobs-SRCH_KO0,{title_len}.htm"
REQUEST_TIMEOUT = 15  # Reduced timeout
RETRY_ATTEMPTS = 2  # Only 2 retries max (Glassdoor is very aggressive)
MIN_DELAY = 0.5  # Minimal delay
MAX_DELAY = 1.5  # Fast requests

# User-Agent Rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
]

# Location aliases for matching
LOCATION_ALIASES = {
    "uk": ["united kingdom", "gb", "britain"],
    "london": ["greater london", "london"],
    "remote": ["work from home", "wfh", "telecommute", "telework", "virtual", "home-based"],
}


def create_session():
    """Create a requests session with automatic retries and connection pooling."""
    session = requests.Session()

    retry_strategy = Retry(
        total=RETRY_ATTEMPTS,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "HEAD"]
    )

    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    return session


def get_headers():
    """Generate headers with sophisticated anti-detection measures."""
    # Realistic browser headers to avoid detection
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Sec-Ch-Ua": '"Not A(Brand";v="99", "Google Chrome";v="120", "Chromium";v="120"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Cache-Control": "max-age=0",
        "Pragma": "no-cache",
    }


def extract_json_from_html(html: str) -> Optional[Dict]:
    """
    Extract JSON data from script tags containing Apollo GraphQL cache.
    
    Looks for embedded data in window.__NEXT_DATA__ or apolloState.
    """
    try:
        # Try to find __NEXT_DATA__
        pattern = r'<script[^>]*>\s*window\.__NEXT_DATA__\s*=\s*({.*?})\s*</script>'
        match = re.search(pattern, html, re.DOTALL)
        
        if match:
            json_str = match.group(1)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass
        
        # Try apolloState pattern
        pattern = r'<script[^>]*>\s*window\.apolloState\s*=\s*({.*?})\s*</script>'
        match = re.search(pattern, html, re.DOTALL)
        
        if match:
            json_str = match.group(1)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass
        
        return None
        
    except Exception as e:
        logger.error(f"Error extracting JSON: {e}")
        return None


def extract_jobs_from_page(html: str) -> List[Dict]:
    """
    Extract job listings from Glassdoor HTML page using BeautifulSoup.
    
    Falls back to direct HTML parsing since GraphQL cache is complex.
    """
    jobs = []
    
    try:
        from bs4 import BeautifulSoup
        
        soup = BeautifulSoup(html, "html.parser")
        
        # Find job containers - Glassdoor uses various selectors
        # Try multiple patterns to catch different page layouts
        job_cards = soup.find_all("li", class_=re.compile(r"JobsList__ListItem|Job.*Card", re.IGNORECASE))
        
        if not job_cards:
            job_cards = soup.find_all("article", class_=re.compile(r"JobCard|JobListing", re.IGNORECASE))
        
        if not job_cards:
            job_cards = soup.find_all("div", class_=re.compile(r"job-card|JobCard", re.IGNORECASE))
        
        logger.info(f"Found {len(job_cards)} job cards")
        
        for card in job_cards:
            try:
                # Try to find job title
                title_elem = card.find("a", {"data-test": "job-link"})
                if not title_elem:
                    title_elem = card.find("a", class_=re.compile(r"jobTitle|job.*title", re.IGNORECASE))
                
                title = title_elem.text.strip() if title_elem else ""
                
                # Extract company
                company_elem = card.find("span", {"data-test": "employer-name"})
                if not company_elem:
                    company_elem = card.find("span", class_=re.compile(r"employer|company", re.IGNORECASE))
                
                company = company_elem.text.strip() if company_elem else ""
                
                # Extract location
                location_elem = card.find("span", {"data-test": "job-location"})
                if not location_elem:
                    location_elem = card.find("span", class_=re.compile(r"location", re.IGNORECASE))
                
                location = location_elem.text.strip() if location_elem else ""
                
                # Get URL
                url = title_elem.get("href") if title_elem else ""
                if url and not url.startswith("http"):
                    url = f"https://www.glassdoor.com{url}"
                
                if title and location:
                    job = {
                        "title": title,
                        "company": company,
                        "location": location,
                        "url": url,
                        "date_added": datetime.utcnow().strftime("%Y-%m-%d"),
                        "source": "glassdoor",
                        "has_applied": False
                    }
                    jobs.append(job)
                    
            except Exception as e:
                logger.debug(f"Error parsing job card: {e}")
                continue
        
        return jobs
        
    except ImportError:
        logger.warning("BeautifulSoup not available")
        return []
    except Exception as e:
        logger.error(f"Error extracting jobs: {e}")
        return []


def location_matches(job_location: str, target_locations: List[str]) -> bool:
    """Check if job location matches any of the target locations."""
    job_loc_lower = job_location.lower()
    
    for target_loc in target_locations:
        target_lower = target_loc.lower()
        
        # Direct match
        if target_lower in job_loc_lower:
            return True
        
        # Check aliases
        for alias in LOCATION_ALIASES.get(target_lower, []):
            if alias in job_loc_lower:
                return True
    
    return False


def fetch_glassdoor_jobs(job_titles: Optional[List[str]] = None, locations: Optional[List[str]] = None) -> List[Dict]:
    """
    Fetch jobs from Glassdoor with advanced anti-detection.

    Uses sophisticated retry logic, delays, and header rotation.
    """
    job_titles = job_titles or config.JOB_KEYWORDS
    locations = locations or ["london", "remote", "uk"]
    normalized_locations = [loc.lower() for loc in locations]

    logger.info("Starting Glassdoor job scraper with anti-detection measures")
    logger.info(f"Job titles: {job_titles}")
    logger.info(f"Locations: {locations}")

    all_jobs = []

    for job_title in job_titles:
        try:
            session = create_session()

            logger.info(f"Searching for '{job_title}' on Glassdoor")

            # Format search URL
            title_slug = job_title.lower().replace(" ", "-")
            url = SEARCH_URL.format(title=title_slug, title_len=len(job_title))

            # Minimal delay
            time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

            response = session.get(url, headers=get_headers(), timeout=REQUEST_TIMEOUT)

            # Fail fast - only retry once on 403
            if response.status_code == 403:
                logger.warning(f"Got 403 - Glassdoor blocking. Retrying once...")
                time.sleep(random.uniform(5.0, 10.0))  # Short wait
                session = create_session()
                response = session.get(url, headers=get_headers(), timeout=REQUEST_TIMEOUT)

                if response.status_code != 200:
                    logger.warning(f"Still blocked. Skipping '{job_title}'")
                    continue

            if response.status_code != 200:
                logger.warning(f"HTTP {response.status_code} for '{job_title}' - skipping")
                continue

            # Extract and filter jobs
            page_jobs = extract_jobs_from_page(response.text)
            logger.info(f"Extracted {len(page_jobs)} jobs for '{job_title}'")

            filtered_jobs = []
            for job in page_jobs:
                if location_matches(job.get("location", ""), normalized_locations):
                    filtered_jobs.append(job)
                    logger.info(f"✅ {job['title']} @ {job['location']}")

            all_jobs.extend(filtered_jobs)
            logger.info(f"Found {len(filtered_jobs)} matching jobs")

        except requests.exceptions.Timeout:
            logger.warning(f"Timeout for '{job_title}' - skipping")
        except requests.exceptions.ConnectionError:
            logger.warning(f"Connection error for '{job_title}' - skipping")
        except Exception as e:
            logger.error(f"Error processing '{job_title}': {e}")

    logger.info(f"Finished scraping. Total jobs found: {len(all_jobs)}")
    return all_jobs


if __name__ == "__main__":
    jobs = fetch_glassdoor_jobs(
        job_titles=["Software Engineer"],
        locations=["London", "Remote", "UK"]
    )
    
    print(f"\n🔍 FOUND {len(jobs)} MATCHING JOBS:\n")
    
    for i, job in enumerate(jobs, 1):
        print(f"📌 Job #{i}: {job['title']}")
        print(f"🏢 Company: {job['company']}")
        print(f"📍 Location: {job['location']}")
        print(f"🔗 URL: {job['url']}")
        print("-" * 60)
