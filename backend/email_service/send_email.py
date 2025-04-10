# email_service/send_email.py

import os
import hashlib
import smtplib
import firebase_admin
from firebase_admin import credentials, firestore
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
from collections import defaultdict
from datetime import datetime
import json

# Load environment variables
load_dotenv()

# Get Firebase credentials path
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")

if not FIREBASE_CREDENTIALS_PATH:
    raise ValueError("Missing FIREBASE_CREDENTIALS_PATH in environment variables. Please set it in the .env file.")

# Prevent multiple Firebase initializations
if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)

# Initialize Firestore
db = firestore.client()

def generate_document_id(job_url):
    """Generate a Firestore-safe document ID from a job URL using hashing."""
    return hashlib.md5(job_url.encode()).hexdigest()

def get_unsent_jobs():
    """Retrieve unsent jobs from Firestore."""
    jobs_collection = db.collection("jobs_compiled")
    
    # Query for jobs that have not been sent or sent is False
    unsent_jobs_query = jobs_collection.where("sent", "==", False)
    
    unsent_jobs = unsent_jobs_query.stream()
    jobs = [job.to_dict() for job in unsent_jobs]
    
    print(f"📋 Found {len(jobs)} unsent jobs")
    return jobs

def mark_jobs_as_sent(jobs):
    """Update Firestore to mark jobs as sent"""
    for job in jobs:
        try:
            # Generate a consistent job ID
            doc_id = generate_document_id(job["url"])
            
            # Reference to the job in the jobs_compiled collection
            job_ref = db.collection("jobs_compiled").document(doc_id)
            
            # Check if document exists
            job_doc = job_ref.get()
            
            if job_doc.exists:
                # Update the document to mark as sent
                job_ref.update({
                    "sent": True,
                    "sent_timestamp": firestore.SERVER_TIMESTAMP
                })
                print(f"✅ Marked job as sent: {job.get('title', 'Unknown Job')} ({doc_id})")
            else:
                print(f"⚠️ Job document not found: {job.get('url', 'Unknown URL')}")
        
        except Exception as e:
            print(f"❌ Error marking job as sent: {e}")

def get_source_platform(url):
    """Extracts job platform based on the URL."""
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
    """Returns an emoji for each platform."""
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
    """Fetches all users who are subscribed."""
    users_ref = db.collection("users").where("subscribed", "==", True).stream()
    return [
        {
            "id": user.id,
            "email": user.to_dict().get("email", ""),
            "jobTitles": user.to_dict().get("jobTitles", []),
            "jobLocations": user.to_dict().get("jobLocations", [])
        }
        for user in users_ref
    ]

def generate_html_email(jobs_by_platform, job_count):
    """Generate a nicely formatted HTML email in John Hegley style with logo."""
    current_date = datetime.now().strftime("%d %B %Y")
    logo_url = "https://res.cloudinary.com/dfsznxwhz/image/upload/v1742992744/nextgig-logo_nqjhvq.svg"
    website_url = "https://next-gig.co.uk"
    
    # John Hegley-inspired witty intro lines
    witty_intros = [
    "Jobs worth getting out of bed for. Even on a Monday.",
    "Careers with bite. No beige biscuits here.",
    "Dug these up from the internet's dusty corners. You're welcome.",
    "Hot off the press. Smells like ambition and strong coffee.",
    "Fresh jobs, no fluff. Just the good stuff, ready to go."
    ]
    
    import random
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
            <h1>Job Alert Spectacular</h1>
            <div class="tagline">Dream gigs delivered. Not searched for.</div>
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
            <p>Cheerfully yours,<br>The Next Gig Bunch</p>
        </div>
        <div class="footer">
            <p>© 2025 Next Gig - Dream gigs delivered. Not searched for.</p>
            <p>You're receiving this because you rather cleverly subscribed to our job alerts.</p>
        </div>
    </body>
    </html>
    """
    
    return html

def send_email_to_user(recipient_email, html_content, job_count, jobs_by_platform):
    """Send a formatted email to a specific user with improved deliverability."""
    subject = f"🚀 {job_count} Fresh Jobs - Next Gig's Latest Discoveries"
    
    # Get email configuration from environment variables
    sender_email = os.getenv("EMAIL_ADDRESS")
    email_password = os.getenv("EMAIL_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    
    # The "From" address that recipients will see
    display_name = "Next Gig Careers"
    display_email = "careers@next-gig.co.uk"
    
    # Create a multipart message
    msg = MIMEMultipart('alternative')
    msg["From"] = f"{display_name} <{display_email}>"
    msg["Reply-To"] = display_email
    msg["To"] = recipient_email
    msg["Subject"] = subject
    
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

Unsubscribe: https://next-gig.co.uk/unsubscribe
"""
    
    # Attach both plain text and HTML versions
    msg.attach(MIMEText(plain_text, 'plain'))
    msg.attach(MIMEText(html_content, 'html'))
    
    # Additional headers to improve deliverability
    msg['List-Unsubscribe'] = '<https://next-gig.co.uk/unsubscribe>'
    msg['Precedence'] = 'bulk'
    
    # Add Message-ID to help with email tracking and reduce spam likelihood
    msg['Message-ID'] = f"<{generate_document_id(recipient_email + str(datetime.now()))}@next-gig.co.uk>"
    
    try:
        # Use a more robust connection method
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, email_password)
            
            # Send the email with additional SMTP debugging
            server.set_debuglevel(1)  # Uncomment for detailed debug info
            
            # Send the email
            server.sendmail(sender_email, recipient_email, msg.as_string())
            
            print(f"✅ Email sent successfully to {recipient_email}!")
            return True
    
    except smtplib.SMTPException as smtp_error:
        print(f"❌ SMTP Error sending email to {recipient_email}: {smtp_error}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error sending email to {recipient_email}: {e}")
        return False
    

def send_job_emails():
    """Send job listings to all subscribed users with personalised content."""
    jobs = get_unsent_jobs()
    if not jobs:
        print("❌ No new jobs found. Skipping email.")
        return False

    # Get all subscribed users
    users = get_subscribed_users()
    if not users:
        print("❌ No subscribed users found. Skipping email.")
        return False

    print(f"📧 Preparing to send job alerts to {len(users)} users...")

    # Track email sending statistics
    total_emails_sent = 0
    total_users_processed = 0
    users_with_matching_jobs = 0

    # Process each user and send personalised emails
    for user in users:
        total_users_processed += 1

        # Filter jobs based on user preferences
        user_jobs = []
        user_job_titles = [title.lower() for title in user.get("jobTitles", [])]
        user_job_locations = [loc.lower() for loc in user.get("jobLocations", [])]

        # Only include jobs that match this user's preferences
        for job in jobs:
            job_title = job.get("title", "").lower()
            job_location = job.get("location", "").lower()

            if any(title in job_title for title in user_job_titles) and \
               any(loc in job_location for loc in user_job_locations):
                user_jobs.append(job)

        if not user_jobs:
            print(f"⚠️ No matching jobs for user {user.get('email', 'Unknown email')}. Skipping email.")
            continue

        users_with_matching_jobs += 1

        # Organise jobs by platform and company
        jobs_by_platform = defaultdict(lambda: defaultdict(list))
        for job in user_jobs:
            platform = get_source_platform(job["url"])
            company_name = job.get("company", "Unknown Company")
            jobs_by_platform[platform][company_name].append(job)

        # Generate HTML email
        try:
            html_content = generate_html_email(jobs_by_platform, len(user_jobs))

            # Send email to this user
            success = send_email_to_user(
                user.get('email', ''), 
                html_content, 
                len(user_jobs), 
                jobs_by_platform
            )

            if success:
                total_emails_sent += 1
                print(f"✅ Sent {len(user_jobs)} job listings to {user.get('email', 'Unknown email')}")
            else:
                print(f"❌ Failed to send email to {user.get('email', 'Unknown email')}")

        except Exception as e:
            print(f"❌ Error processing email for user {user.get('email', 'Unknown email')}: {e}")
            import traceback
            traceback.print_exc()

    # Mark all processed jobs as sent
    mark_jobs_as_sent(jobs)

    # Provide comprehensive summary
    print("\n📊 Email Sending Summary:")
    print(f"Total Users Processed: {total_users_processed}")
    print(f"Users with Matching Jobs: {users_with_matching_jobs}")
    print(f"Total Emails Sent: {total_emails_sent}")

    return total_emails_sent > 0