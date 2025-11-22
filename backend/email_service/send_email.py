import os
import hashlib
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from collections import defaultdict
from datetime import datetime
import random
from resend import Emails, Email

# Load environment variables
load_dotenv()

FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")

if not FIREBASE_CREDENTIALS_PATH:
    raise ValueError("Missing FIREBASE_CREDENTIALS_PATH in environment variables. Please set it in the .env file.")

if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def generate_document_id(job_url):
    return hashlib.md5(job_url.encode()).hexdigest()

def get_unsent_jobs():
    jobs_collection = db.collection("jobs_compiled")
    unsent_jobs_query = jobs_collection.where("sent", "==", False)
    unsent_jobs = unsent_jobs_query.stream()
    jobs = [job.to_dict() for job in unsent_jobs]
    print(f"📋 Found {len(jobs)} unsent jobs")
    return jobs

def get_unnotified_jobs_for_user(user_id):
    matches_ref = db.collection("user_job_matches") \
        .where("user_id", "==", user_id) \
        .where("notified", "==", False)
    return [
        {
            "id": match.id,
            **match.to_dict()
        }
        for match in matches_ref.stream()
    ]

def mark_jobs_as_sent(jobs):
    for job in jobs:
        try:
            doc_id = generate_document_id(job["url"])
            job_ref = db.collection("jobs_compiled").document(doc_id)
            job_doc = job_ref.get()

            if job_doc.exists:
                job_ref.update({
                    "sent": True,
                    "sent_timestamp": firestore.SERVER_TIMESTAMP
                })
                print(f"✅ Marked job as sent: {job.get('title', 'Unknown Job')} ({doc_id})")
            else:
                fallback_data = {
                    "title": job.get("title", "Unknown"),
                    "url": job.get("url", ""),
                    "company": job.get("company", "Unknown"),
                    "location": job.get("location", "Unknown"),
                    "sent": True,
                    "sent_timestamp": firestore.SERVER_TIMESTAMP,
                    "source": job.get("source", "unknown"),
                    "first_seen": firestore.SERVER_TIMESTAMP
                }
                job_ref.set(fallback_data)
                print(f"✅ Created and marked job as sent: {job.get('title', 'Unknown Job')} ({doc_id})")
        except Exception as e:
            print(f"❌ Error marking job as sent: {e}")

def get_source_platform(url):
    if "linkedin.com" in url:
        return "LinkedIn"
    elif "workable.com" in url:
        return "Workable"
    elif "unjobs.org" in url:
        return "UN Jobs"
    elif "ifyoucouldjobs.com" in url:
        return "If You Could"
    elif "ziprecruiter.com" in url:
        return "ZipRecruiter"
    else:
        return "Other"

def get_platform_icon(platform):
    icons = {
        "LinkedIn": "🔵",
        "Workable": "🟠",
        "UN Jobs": "🌍",
        "If You Could": "🎨",
        "ZipRecruiter": "💼",
        "Other": "🌐"
    }
    return icons.get(platform, "🌐")

def get_subscribed_users():
    """
    FREE ACCESS MODE: Fetch all users with job preferences who have email notifications enabled.
    Filters by emailNotificationsEnabled field (defaults to true if field doesn't exist).
    """
    # FREE MODE: Get ALL users with job preferences and email notifications enabled
    users_ref = db.collection("users").stream()
    return [
        {
            "id": user.id,
            "email": user.to_dict().get("email", ""),
            "jobTitles": user.to_dict().get("jobTitles", []),
            "jobLocations": user.to_dict().get("jobLocations", [])
        }
        for user in users_ref
        # Only include users with job preferences AND email notifications enabled
        if (user.to_dict().get("jobTitles") and
            user.to_dict().get("jobLocations") and
            user.to_dict().get("emailNotificationsEnabled", True))  # Default to True if field missing
    ]

def generate_html_email(jobs_by_platform, job_count, recipient_email):
    """Generate a nicely formatted HTML email in John Hegley style with logo."""
    current_date = datetime.now().strftime("%d %B %Y")
    logo_url = "https://res.cloudinary.com/dfsznxwhz/image/upload/f_png,w_300,q_auto/v1742992744/nextgig-logo_nqjhvq.png"
    website_url = "https://next-gig.co.uk"
    unsubscribe_url = f"https://next-gig.co.uk/unsubscribe?email={recipient_email}"
    
    # John Hegley-inspired witty intro lines
    witty_intros = [
    "Jobs worth getting out of bed for. Even on a Monday.",
    "Careers with bite. No beige biscuits here.",
    "Dug these up from the internet's dusty corners. You're welcome.",
    "Hot off the press. Smells like ambition and strong coffee.",
    "Fresh jobs, no fluff. Just the good stuff, ready to go."
    ]
    
    witty_intro = random.choice(witty_intros)
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <style>
    body {{
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }}
    .header {{
        background-color: #f0f0f0;
        padding: 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
    }}
    .logo {{
        max-width: 150px;
        margin-bottom: 15px;
    }}
    .tagline {{
        font-style: italic;
        font-size: 16px;
        margin-top: 5px;
        color: #333;
    }}
    .content {{
        padding: 20px;
        background: #f9f9f9;
    }}
    .platform {{
        margin-top: 25px;
        border-bottom: 2px solid #333;
        padding-bottom: 5px;
        font-size: 18px;
        font-weight: bold;
    }}
    .company {{
        margin-top: 15px;
        font-weight: bold;
        color: #333;
    }}
    .job {{
        margin: 10px 0 20px 15px;
        padding-left: 10px;
        border-left: 3px solid #ddd;
    }}
    .job-title {{
        font-weight: bold;
        color: #4A90E2;
    }}
    .job-location {{
        color: #666;
        font-style: italic;
    }}
    .job-link {{
        display: inline-block;
        margin-top: 5px;
        color: #4A90E2;
        text-decoration: none;
        background: #e6f0ff;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 14px;
    }}
    .job-link:hover {{
        background: #d1e3ff;
        text-decoration: none;
    }}
    .footer {{
        text-align: center;
        padding: 20px;
        font-size: 12px;
        color: #999;
        background: #f1f1f1;
        border-radius: 0 0 5px 5px;
    }}
    .highlight {{
        background-color: #ffffcc;
        padding: 2px 5px;
        border-radius: 3px;
    }}
    .witty-intro {{
        font-style: italic;
        color: #666;
        margin-bottom: 20px;
        font-size: 16px;
        border-left: 4px solid #4A90E2;
        padding-left: 10px;
    }}
    .main-cta {{
        display: block;
        background-color: #4A90E2;
        color: white !important;
        text-align: center;
        padding: 12px 20px;
        margin: 30px auto;
        border-radius: 5px;
        font-weight: bold;
        width: 200px;
        text-decoration: none;
    }}
    .main-cta:hover {{
        background-color: #3a7bc8;
    }}
    
    /* Force all h1 and p tags to have the same colour */
    h1 {{
        color: #333 !important;
    }}
    
    p {{
        color: #333 !important;
    }}
</style>
    </head>
    <body>
        <div class="header">
            <img src="{logo_url}" alt="Next Gig Logo" class="logo">
        <h1>Your Job Alerts</h1>
        <div class="tagline">Job Hunting Finally Organised</div>
            <p>{current_date}</p>
        </div>
        <div class="content">
            <p>Hello there,</p>
            
            <p class="witty-intro">"{witty_intro}"</p>
            
            <p>We've spotted <span class="highlight">{job_count} shiny new job listings</span> that might just tickle your fancy:</p>
    """
    
    # Add job listings by platform and company without direct links
    for platform, companies in sorted(jobs_by_platform.items()):
        platform_icon = get_platform_icon(platform)
        html += f'<div class="platform">{platform_icon} {platform}</div>'
        
        for company, company_jobs in sorted(companies.items()):
            html += f'<div class="company">🏢 {company}</div>'
            
            for job in company_jobs:
                html += f'''
                <div class="job">
                    <div class="job-title">{job['title']}</div>
                    <div class="job-location">📍 {job['location']}</div>
                </div>
                '''
    
    # Add a main CTA to direct users to the website
    html += f"""
            <p>To view full job details and apply, visit our website:</p>
            <a href="{website_url}" class="main-cta">Visit Next Gig</a>
            
            <p>May your applications be swift and your interviews be splendid!</p>
            <p>Cheerfully yours,<br>The Next Gig Team </p>
        </div>
        <div class="footer">
            <p>© 2025 Next Gig - Job Hunting Finally Organised.</p>
            <p>You're receiving this because you rather cleverly subscribed to our job alerts.</p>
            <p><a href="{unsubscribe_url}" style="color: #999; text-decoration: underline;">Unsubscribe from job alerts</a></p>
        </div>
    </body>
    </html>
    """
    
    return html

def send_email_to_user(recipient_email, html_content, job_count, jobs_by_platform):
    """Send a formatted email to a specific user using Resend API."""
    subject = f"🚀 {job_count} Fresh Jobs - Next Gig's Latest Discoveries"

    # Get Resend API key from environment
    resend_api_key = os.getenv("RESEND_API_KEY")

    if not resend_api_key:
        print(f"❌ RESEND_API_KEY not found in environment variables")
        return False

    # The "From" address that recipients will see
    display_name = "Next Gig Careers"
    display_email = "careers@next-gig.co.uk"
    from_address = f"{display_name} <{display_email}>"

    # Create plain text alternative
    plain_text = f"""
Job Opportunities ({job_count} new listings)

Quick Preview:
{' '.join([f"- {job['title']} at {job.get('company', 'Unknown Company')}"
           for platform in jobs_by_platform.values()
           for company_jobs in platform.values()
           for job in company_jobs])}

Visit https://next-gig.co.uk to view full details and apply.

Best regards,
Next Gig Team

Unsubscribe: https://next-gig.co.uk/unsubscribe?email={recipient_email}
"""

    try:
        # Set the API key in environment for Resend client
        os.environ["RESEND_API_KEY"] = resend_api_key

        # Create Email object using dict to handle 'from' keyword
        email_dict = {
            "from": from_address,
            "to": recipient_email,
            "subject": subject,
            "html": html_content,
            "text": plain_text,
            "reply_to": display_email,
            "headers": {
                "List-Unsubscribe": f"<https://next-gig.co.uk/unsubscribe?email={recipient_email}>",
                "Precedence": "bulk",
                "Message-ID": f"<{generate_document_id(recipient_email + str(datetime.now()))}@next-gig.co.uk>"
            }
        }

        email = Email(**email_dict)

        # Send email using Emails client
        client = Emails()
        response = client.send(email)

        # Response is a dict with 'id' key on success
        if response and isinstance(response, dict) and response.get('id'):
            print(f"✅ Email sent successfully to {recipient_email}! (ID: {response.get('id')})")
            return True
        elif response and hasattr(response, 'id'):
            print(f"✅ Email sent successfully to {recipient_email}! (ID: {response.id})")
            return True
        else:
            print(f"❌ Failed to send email to {recipient_email}: {response}")
            return False

    except Exception as e:
        print(f"❌ Error sending email to {recipient_email}: {e}")
        import traceback
        traceback.print_exc()
        return False
    

def send_job_emails():
    users = get_subscribed_users()
    if not users:
        print("❌ No subscribed users found. Skipping email.")
        return False

    print(f"📧 Preparing to send job alerts to {len(users)} users...")
    total_emails_sent = 0
    total_users_processed = 0
    users_with_matching_jobs = 0

    for user in users:
        total_users_processed += 1
        user_jobs = get_unnotified_jobs_for_user(user["id"])

        if not user_jobs:
            print(f"⚠️ No new matched jobs for {user['email']}. Skipping.")
            continue

        users_with_matching_jobs += 1
        jobs_by_platform = defaultdict(lambda: defaultdict(list))
        for job in user_jobs:
            job_details = job.get("job_details", {})
            platform = get_source_platform(job_details.get("url", ""))
            company = job_details.get("company", "Unknown Company")
            jobs_by_platform[platform][company].append(job_details)

        html_content = generate_html_email(jobs_by_platform, len(user_jobs), user["email"])
        success = send_email_to_user(user["email"], html_content, len(user_jobs), jobs_by_platform)

        if success:
            total_emails_sent += 1
            print(f"✅ Sent {len(user_jobs)} job listings to {user['email']}")
            # Mark these matches as notified
            for job in user_jobs:
                match_id = job.get("id")
                if match_id:
                    db.collection("user_job_matches").document(match_id).update({"notified": True})
        else:
            print(f"❌ Failed to send email to {user['email']}")

    print("\n📊 Email Sending Summary:")
    print(f"Total Users Processed: {total_users_processed}")
    print(f"Users with New Matches: {users_with_matching_jobs}")
    print(f"Total Emails Sent: {total_emails_sent}")

    return total_emails_sent > 0

# Optional debug tool
def debug_user_job_matches():
    users = get_subscribed_users()
    for user in users:
        email = user.get("email", "Unknown")
        titles = [t.lower() for t in user.get("jobTitles", [])]
        locations = [l.lower() for l in user.get("jobLocations", [])]
        matches = []
        for job in db.collection("jobs_compiled").stream():
            job_data = job.to_dict()
            if any(t in job_data.get("title", "").lower() for t in titles) and \
               any(l in job_data.get("location", "").lower() for l in locations):
                matches.append(job_data)
        print(f"📧 {email} matched {len(matches)} jobs")

if __name__ == "__main__":
    send_job_emails()
    # Uncomment this to debug job matches:
    # debug_user_job_matches()