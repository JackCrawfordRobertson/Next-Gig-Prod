import os
import logging
import functools
from geopy.geocoders import Nominatim
from geopy.distance import geodesic

class LocationMatcher:
    def __init__(self, fallback_regions=None):
        # Caching to reduce geocoding API calls
        self.location_cache = {}
        
        # Logging setup
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Import fallback regions from config
        try:
            from config import LOCATION_FALLBACK_REGIONS
            self.fallback_regions = fallback_regions or LOCATION_FALLBACK_REGIONS
        except ImportError:
            self.logger.warning("Could not import LOCATION_FALLBACK_REGIONS. Using empty dictionary.")
            self.fallback_regions = fallback_regions or {}
        
        # Geocoder with user agent
        self.geolocator = Nominatim(user_agent="next_gig_job_search")
    
    def get_fallback_locations(self, primary_location):
        """
        Get fallback locations for a given primary location
        
        :param primary_location: Primary location to find fallbacks for
        :return: List of fallback locations
        """
        # Normalize location to lowercase for consistent matching
        primary_location = primary_location.lower().strip()
        
        # Direct match in fallback regions
        fallback_locations = self.fallback_regions.get(primary_location, [])
        
        # Add the primary location itself
        if primary_location not in fallback_locations:
            fallback_locations.append(primary_location)
        
        return fallback_locations
    
    @functools.lru_cache(maxsize=1000)
    def geocode_location(self, location):
        """
        Geocode a location with caching to reduce API calls
        """
        try:
            # Check cache first
            if location in self.location_cache:
                return self.location_cache[location]
            
            # Try full location first
            result = self.geolocator.geocode(f"{location}, United Kingdom", 
                                             addressdetails=True)
            
            # Fallback strategies
            if not result:
                city_fallbacks = {
                    "london": "London, United Kingdom",
                    "manchester": "Manchester, United Kingdom",
                    "birmingham": "Birmingham, United Kingdom",
                }
                if location.lower() in city_fallbacks:
                    result = self.geolocator.geocode(city_fallbacks[location.lower()])
            
            if result:
                coordinates = (result.latitude, result.longitude)
                self.location_cache[location] = coordinates
                return coordinates
            
            return None
        
        except Exception as e:
            self.logger.error(f"Geocoding error for {location}: {e}")
            return None
    
    def calculate_distance(self, loc1, loc2):
        """
        Calculate geodesic distance between two locations
        """
        try:
            return geodesic(loc1, loc2).kilometers
        except Exception as e:
            self.logger.error(f"Distance calculation error: {e}")
            return float('inf')
    
    def find_jobs_within_radius(self, job_title, user_location, 
                                 job_list, max_radius_km=50):
        """
        Find jobs within a specific radius of the user's location
        """
        # Geocode user location
        user_coords = self.geocode_location(user_location)
        
        if not user_coords:
            self.logger.warning(f"Could not geocode location: {user_location}")
            return []
        
        # Filter jobs by matching title and within radius
        matched_jobs = []
        
        for job in job_list:
            # Flexible title matching (partial match)
            if job_title.lower() not in job['title'].lower():
                continue
            
            # Geocode job location
            job_coords = self.geocode_location(job['location'])
            
            if not job_coords:
                continue
            
            # Calculate distance
            distance = self.calculate_distance(user_coords, job_coords)
            
            if distance <= max_radius_km:
                # Add distance information to job
                job['distance_km'] = round(distance, 2)
                matched_jobs.append(job)
        
        # Sort by distance
        return sorted(matched_jobs, key=lambda x: x['distance_km'])

def find_matching_jobs(user_jobs, user_preferences, max_radius_km=50):
    """
    Advanced job matching with geographical intelligence and fallback regions
    
    :param user_jobs: List of all jobs
    :param user_preferences: Dictionary with job_titles and locations
    :param max_radius_km: Maximum search radius
    :return: List of matched jobs
    """
    matcher = LocationMatcher()
    final_matched_jobs = []
    
    for title in user_preferences.get('job_titles', []):
        for location in user_preferences.get('locations', []):
            # Get fallback locations
            fallback_locations = matcher.get_fallback_locations(location)
            
            # Search across all fallback locations
            for fallback_location in fallback_locations:
                # Radius search for each fallback location
                radius_matches = matcher.find_jobs_within_radius(
                    title, 
                    fallback_location, 
                    user_jobs, 
                    max_radius_km=max_radius_km
                )
                
                final_matched_jobs.extend(radius_matches)
    
    # Remove duplicates while preserving order
    unique_matched_jobs = []
    seen = set()
    for job in final_matched_jobs:
        job_key = job['url']  # Use URL as unique identifier
        if job_key not in seen:
            seen.add(job_key)
            unique_matched_jobs.append(job)
    
    return unique_matched_jobs