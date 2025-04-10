import os
import json
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

firebase_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

if firebase_json:
    try:
        firebase_credentials = json.loads(firebase_json)
        firebase_credentials_path = "/tmp/firebase_credentials.json"
        with open(firebase_credentials_path, "w") as f:
            json.dump(firebase_credentials, f)
    except json.JSONDecodeError:
        raise ValueError("❌ Invalid FIREBASE_CREDENTIALS_JSON format!")
else:
    firebase_credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

if not firebase_credentials_path:
    raise ValueError("❌ FIREBASE_CREDENTIALS_PATH is missing!")

if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_credentials_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Location-based search configurations
MAX_SEARCH_RADIUS_KM = 50  # Default search radius

LOCATION_FALLBACK_REGIONS = {
    "london": ["reading", "oxford", "cambridge", "bristol", "basingstoke", "slough", "watford", "staines", "high wycombe", "gillingham"],
    "manchester": ["liverpool", "leeds", "sheffield", "bolton", "stockport", "salford", "oldham", "bury", "rochdale", "bury"],
    "birmingham": ["coventry", "wolverhampton", "west bromwich", "solihull", "redditch", "dudley", "tamworth", "walsall", "sutton coldfield", "bromsgrove"],
    "glasgow": ["edinburgh", "dunfermline", "paisley", "stirling", "clydebank", "livingston", "kilmarnock", "greenock", "arbroath", "airdrie"],
    "bristol": ["bath", "cardiff", "swindon", "gloucester", "exeter", "newport", "worcester", "chippenham", "stroud", "taunton"],
    "leeds": ["harrogate", "wakefield", "bradford", "halifax", "huddersfield", "keighley", "brighouse", "shipley", "otley", "ilkley"],
    "newcastle": ["sunderland", "durham", "morpeth", "gateshead", "south shields", "whitley bay", "alnwick", "hexham", "consett", "blaydon"],
    "edinburgh": ["dunfermline", "falkirk", "livingston", "glasgow", "stirling", "perth", "inverness", "aberdeen", "haddington", "south queensferry"],
    "cardiff": ["newport", "swindon", "bristol", "merthyr tydfil", "pontypridd", "aberdare", "caerphilly", "blackwood", "cwmbran", "bargoed"],
    "southampton": ["portsmouth", "winchester", "fareham", "basingstoke", "andover", "eastleigh", "totton", "romsey", "new milton", "gosport"],
    "nottingham": ["derby", "leicester", "birmingham", "lincoln", "stoke-on-trent", "grantham", "rushcliffe", "mansfield", "retford", "ashfield"],
    "leicester": ["derby", "nottingham", "birmingham", "coventry", "lincoln", "grantham", "hinkley", "rugby", "kettering", "corby"],
    "aberdeen": ["inverness", "perth", "falkirk", "dundee", "montrose", "elgin", "stonehaven", "banchory", "aboyne", "fraserburgh"],
    "liverpool": ["warrington", "st helens", "birkenhead", "wigan", "chester", "blackpool", "preston", "southport", "bootle", "widnes"],
    "oxford": ["reading", "swindon", "milton keynes", "cambridge", "london", "basingstoke", "high wycombe", "guildford", "leighton buzzard", "bedford"],
    "derby": ["nottingham", "birmingham", "leicester", "sheffield", "stoke-on-trent", "macclesfield", "ashbourne", "ilkeston", "ripley", "chesterfield"],
    # Add more region mappings as needed
}


def get_subscribed_users():
    """Fetches all users who are subscribed or on trial."""
    users_ref = db.collection("users").stream()
    subscribed_users = []

    for user_doc in users_ref:
        user_data = user_doc.to_dict()
        if user_data.get("status") in ["subscribed", "trial"]:
            subscribed_users.append(user_data)

    return subscribed_users

def get_unique_job_titles():
    """Fetches unique job titles across all subscribed users."""
    users = get_subscribed_users()
    job_titles = set() 

    for user in users:
        job_titles.update(user.get("jobTitles", [])) 

    return list(job_titles)  

LOCATION = os.getenv("LOCATION", "United Kingdom")