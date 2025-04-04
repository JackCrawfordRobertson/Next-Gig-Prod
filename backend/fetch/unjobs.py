import sys
import os
import time
import random
import cloudscraper
from bs4 import BeautifulSoup
from datetime import datetime
import logging
import json
import hashlib
import concurrent.futures
from threading import Lock

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("unjobs_scraper.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("UNJobsScraper")

# Ensure script finds `config.py`
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import config

# Constants
BASE_URL = "https://unjobs.org/search/{query}"
CACHE_FILE = "unjobs_cache.json"
CACHE_EXPIRY_HOURS = 24  # Cache results for 24 hours
MAX_WORKERS = 3  # Number of concurrent workers (keep low to avoid triggering CloudFlare)

# Filtering rules
EXCLUDED_KEYWORDS = ["senior", "director", "lead", "head", "manager", "principal"]
LOCATION_ALIASES = {
    "uk": ["united kingdom", "britain", "england", "scotland", "wales", "northern ireland"],
    "london": ["greater london"],
    "remote": ["work from home", "wfh", "telecommute", "telework", "virtual", "home-based"],
}

# User-Agent Rotation - More diverse browser signatures
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.124 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.78",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0",
    "Mozilla/5.0 (iPad; CPU OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1",
]

# Thread-safe cache implementation
class ThreadSafeCache:
    """Thread-safe caching mechanism for job listings"""
    
    def __init__(self, cache_file):
        self.cache_file = cache_file
        self.cache = self._load_cache()
        self.lock = Lock()
    
    def _load_cache(self):
        """Load cache from file if it exists"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r') as f:
                    cache = json.load(f)
                logger.info(f"Loaded {len(cache)} cached items")
                return cache
        except Exception as e:
            logger.error(f"Error loading cache: {e}")
        return {}
    
    def save_cache(self):
        """Save cache to file"""
        with self.lock:
            try:
                with open(self.cache_file, 'w') as f:
                    json.dump(self.cache, f)
                logger.info(f"Saved {len(self.cache)} items to cache")
            except Exception as e:
                logger.error(f"Error saving cache: {e}")
    
    def get(self, key):
        """Get item from cache (thread-safe)"""
        with self.lock:
            if key in self.cache:
                item = self.cache[key]
                timestamp = item.get('timestamp', 0)
                current_time = datetime.now().timestamp()
                if current_time - timestamp < CACHE_EXPIRY_HOURS * 3600:
                    return item.get('data')
        return None
    
    def set(self, key, data):
        """Set item in cache (thread-safe)"""
        with self.lock:
            self.cache[key] = {
                'timestamp': datetime.now().timestamp(),
                'data': data
            }

# Other utility functions remain the same
def location_matches(job_text, target_locations):
    """Check if job matches any of the target locations"""
    job_text = job_text.lower()
    
    for location in target_locations:
        loc_lower = location.lower()
        
        # Direct match
        if loc_lower in job_text:
            return True
        
        # Check aliases
        for alias in LOCATION_ALIASES.get(loc_lower, []):
            if alias in job_text:
                return True
    
    return False

def extract_location_from_title(title):
    """Extract location from title - UN jobs often list it after the last comma"""
    parts = title.split(',')
    if len(parts) > 1:
        return parts[-1].strip()
    return "Unknown"

def create_cache_key(url):
    """Create a hash for cache key"""
    return hashlib.md5(url.encode()).hexdigest()

# Adaptive delay function to reduce waiting time while avoiding 403s
def adaptive_delay(request_type="page"):
    """More intelligent delay based on request type"""
    if request_type == "page":
        return random.uniform(5.0, 10.0)  # Shorter delay for main pages
    elif request_type == "detail":
        return random.uniform(2.0, 4.0)   # Even shorter for detail pages
    else:
        return random.uniform(1.0, 2.0)   # Default delay

# Thread-safe scraper creation
def create_safe_scraper():
    """Create a cloudscraper instance with compatible browser settings"""
    # Use only validated browser and platform combinations
    browsers = ['chrome', 'firefox']
    platforms = ['windows', 'linux']
    
    return cloudscraper.create_scraper(
        browser={
            'browser': random.choice(browsers),
            'platform': random.choice(platforms),
            'desktop': True
        },
        delay=3  # Reduced base delay
    )

# Optimised job details fetching
def fetch_job_details(url, scraper, headers, cache):
    """Fetch detailed job information with improved caching"""
    cache_key = create_cache_key(url)
    cached_data = cache.get(cache_key)
    
    if cached_data:
        logger.debug(f"Using cached job details for: {url}")
        return cached_data
    
    try:
        logger.info(f"Fetching job details: {url}")
        
        # Use adaptive delay for detail pages
        time.sleep(adaptive_delay("detail"))
        
        response = scraper.get(url, headers=headers)
        
        if response.status_code != 200:
            logger.warning(f"Failed to get job details: {url} (Status: {response.status_code})")
            return {}
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Extract detailed information
        details = {}
        
        # Try to get better location information
        location_elem = soup.select_one("div.location") or soup.select_one("span.location")
        if location_elem:
            details["location"] = location_elem.text.strip()
        
        # Get job description
        description_elem = soup.select_one("div.description") or soup.select_one("div.content")
        if description_elem:
            details["description"] = description_elem.text.strip()
        
        # Cache the results
        cache.set(cache_key, details)
        return details
        
    except Exception as e:
        logger.error(f"Error fetching job details: {e}")
        return {}

# Process a single job keyword
def process_job_keyword(job_keyword, locations, shared_cache, shared_visited_urls):
    """Process a single job keyword search"""
    normalized_locations = [loc.lower() for loc in locations]
    jobs_found = []
    
    # Create local sets for this thread
    visited_pages = set()
    local_visited_job_urls = set()
    
    # Copy already visited URLs to avoid duplicates
    with shared_visited_urls[0]:
        local_visited_job_urls = shared_visited_urls[1].copy()
    
    # Create a unique scraper for this thread
    scraper = create_safe_scraper()
    
    query = job_keyword.lower().replace(" ", "-")
    search_url = BASE_URL.format(query=query)
    
    logger.info(f"Searching for '{job_keyword}' → {search_url}")
    
    current_page = search_url
    page_count = 1
    
    while current_page and page_count <= 3:  # Limit to 3 pages per search
        if current_page in visited_pages:
            logger.warning(f"Loop detected! Already visited {current_page}")
            break
            
        visited_pages.add(current_page)
        
        # Rotate user agent
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0",
        }
        
        logger.info(f"Fetching page {page_count} for '{job_keyword}': {current_page}")
        
        try:
            # Use adaptive delay for page requests
            time.sleep(adaptive_delay("page"))
            
            response = scraper.get(current_page, headers=headers)
            
            if response.status_code == 403:
                logger.warning(f"Forbidden (403) when accessing {current_page}")
                logger.info("Adding longer delay and retrying...")
                
                # Add a longer delay before retry
                time.sleep(random.uniform(20.0, 30.0))
                
                # Create a new scraper instance with different settings
                scraper = create_safe_scraper()
                
                # Retry with new scraper
                response = scraper.get(current_page, headers=headers)
                
                if response.status_code == 403:
                    logger.error(f"Still forbidden after retry. Skipping search term: {job_keyword}")
                    break
            
            elif response.status_code != 200:
                logger.error(f"Failed to fetch page: {current_page} (Status: {response.status_code})")
                break
            
            soup = BeautifulSoup(response.text, "html.parser")
            job_elements = soup.select("a.jtitle")
            
            logger.info(f"Found {len(job_elements)} job elements on page {page_count} for '{job_keyword}'")
            
            # Process each job listing
            for job_element in job_elements:
                title = job_element.text.strip()
                url = job_element["href"]
                
                # Fix relative URLs
                if not url.startswith("https://"):
                    url = "https://unjobs.org" + url if not url.startswith("/") else "https://unjobs.org" + url
                
                # Thread-safe check for already processed URLs
                with shared_visited_urls[0]:
                    if url in shared_visited_urls[1]:
                        continue
                    shared_visited_urls[1].add(url)
                    local_visited_job_urls.add(url)
                
                # Skip senior roles
                if any(keyword.lower() in title.lower() for keyword in EXCLUDED_KEYWORDS):
                    logger.debug(f"Skipping senior role: {title}")
                    continue
                
                # Check if title matches the search term
                if job_keyword.lower() not in title.lower():
                    continue
                
                # Get location from title
                extracted_location = extract_location_from_title(title)
                
                # Create initial job object
                job = {
                    "title": title,
                    "company": "UN Jobs",
                    "location": extracted_location,
                    "url": url,
                    "date_added": datetime.utcnow().strftime("%Y-%m-%d"),
                    "source": "unjobs",
                    "has_applied": False
                }
                
                # Get additional details
                details = fetch_job_details(url, scraper, headers, shared_cache)
                
                # Update with any additional details found
                job.update(details)
                
                # Check if location matches using both title and description
                combined_text = f"{title} {job['location']} {job.get('description', '')}"
                location_match = location_matches(combined_text, normalized_locations)
                
                if location_match:
                    logger.info(f"✅ Job Found: {title} @ {job['location']}")
                    jobs_found.append(job)
                else:
                    logger.debug(f"❌ Location mismatch: {title} @ {job['location']}")
            
            # Check for pagination
            next_button = soup.select_one("a.ts")
            if next_button:
                next_url = next_button["href"]
                
                # Fix relative URLs
                if not next_url.startswith("https://"):
                    next_url = "https://unjobs.org" + next_url if not next_url.startswith("/") else "https://unjobs.org" + next_url
                
                if next_url in visited_pages:
                    logger.warning("Pagination loop detected. Stopping.")
                    break
                
                logger.info(f"Moving to next page: {next_url}")
                current_page = next_url
                page_count += 1
            else:
                logger.info(f"No more pages for '{job_keyword}'. Finishing keyword.")
                break
                
        except Exception as e:
            logger.error(f"Error processing page: {e}")
            break
    
    logger.info(f"Finished processing '{job_keyword}'. Found {len(jobs_found)} matching jobs.")
    return jobs_found

# Main parallel scraping function
def fetch_unjobs_parallel(job_titles=None, locations=None, max_workers=MAX_WORKERS):
    """
    Scrape UN Jobs in parallel using multiple threads
    
    :param job_titles: List of job titles to search for
    :param locations: List of locations to filter by
    :param max_workers: Maximum number of concurrent workers
    :return: List of job dictionaries
    """
    # Use provided parameters or defaults
    job_titles = job_titles or config.JOB_KEYWORDS
    locations = locations or ['london', 'remote', 'uk']
    
    logger.info(f"Starting parallel UN Jobs scraping with {max_workers} workers")
    logger.info(f"Job titles: {job_titles}")
    logger.info(f"Locations: {locations}")
    
    # Initialize thread-safe cache
    shared_cache = ThreadSafeCache(CACHE_FILE)
    
    # Shared visited URLs with lock
    shared_visited_urls = (Lock(), set())
    
    all_jobs = []
    
    # Use appropriate number of workers (don't exceed number of job titles)
    actual_workers = min(max_workers, len(job_titles))
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=actual_workers) as executor:
        # Submit all jobs to the executor
        future_to_keyword = {
            executor.submit(
                process_job_keyword, 
                job_keyword, 
                locations, 
                shared_cache, 
                shared_visited_urls
            ): job_keyword for job_keyword in job_titles
        }
        
        # Process results as they complete
        for future in concurrent.futures.as_completed(future_to_keyword):
            job_keyword = future_to_keyword[future]
            try:
                jobs = future.result()
                all_jobs.extend(jobs)
                logger.info(f"Completed processing for '{job_keyword}': found {len(jobs)} jobs")
            except Exception as e:
                logger.error(f"Error processing '{job_keyword}': {e}")
    
    # Save cache when everything is done
    shared_cache.save_cache()
    
    logger.info(f"Finished parallel scraping. Total jobs found: {len(all_jobs)}")
    return all_jobs

# Maintain backward compatibility with old function
def fetch_unjobs_sync(job_titles=None, locations=None):
    """
    Legacy wrapper for compatibility - calls parallel version
    """
    return fetch_unjobs_parallel(job_titles, locations, max_workers=1)

if __name__ == "__main__":
    # Test the parallel scraper with appropriate worker count
    job_titles = ['Frontend Engineer', 'UX Designer', 'Software Developer']
    worker_count = min(MAX_WORKERS, len(job_titles))
    
    jobs = fetch_unjobs_parallel(
        job_titles=job_titles,
        locations=['London', 'Remote', 'UK'],
        max_workers=worker_count
    )
    
    print(f"\n🔍 FOUND {len(jobs)} MATCHING JOBS:")
    
    for i, job in enumerate(jobs, 1):
        print(f"\n📌 Job #{i}: {job['title']}")
        print(f"🏢 Company: {job['company']}")
        print(f"📍 Location: {job['location']}")
        print(f"🔗 URL: {job['url']}")
        print("-" * 50)