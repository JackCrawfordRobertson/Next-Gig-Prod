from .glassdoor import *
from .ifyoucould import *
from .linkedin import *
from .unjobs import fetch_unjobs_parallel, fetch_unjobs_sync  # Update this line
from .workable import *
from .ziprecruiter import *
from .run_scrapers import run_scrapers

JOB_SOURCES = ["glassdoor", "ifyoucould", "linkedin", "unjobs", "workable", "ziprecruiter"]

__all__ = [
    "fetch_glassdoor_jobs", 
    "ifyoucould", 
    "linkedin", 
    "fetch_unjobs_parallel", 
    "fetch_unjobs_sync",     
    "workable", 
    "ziprecruiter", 
    "run_scrapers"
]