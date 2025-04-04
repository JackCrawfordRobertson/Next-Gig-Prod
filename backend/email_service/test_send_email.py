from send_email import generate_html_email, send_email_to_user
from collections import defaultdict
def test_send_actual_email():
    """Test sending an actual email with sample job data"""
    # Sample job data (same as in your test_template.py)
    jobs_by_platform = defaultdict(lambda: defaultdict(list))
    
    # LinkedIn jobs
    jobs_by_platform["LinkedIn"]["Google"] = [
        {
            "title": "Frontend Engineer",
            "location": "London, UK",
            "url": "https://linkedin.com/jobs/123"
        },
        {
            "title": "UX Designer",
            "location": "Remote",
            "url": "https://linkedin.com/jobs/456"
        }
    ]
    
    jobs_by_platform["If You Could"]["Spotify"] = [
        {
            "title": "Web Developer",
            "location": "London, UK",
            "url": "https://ifyoucouldjobs.com/job/789"
        }
    ]
    
    jobs_by_platform["UN Jobs"]["United Nations"] = [
        {
            "title": "Software Developer",
            "location": "London, UK",
            "url": "https://unjobs.org/job/123"
        }
    ]
    
    # Generate HTML email
    html = generate_html_email(jobs_by_platform, 4)
    
    # Send email to the specific test email address
    recipient_email = "jack@ya-ya.co.uk"
    send_email_to_user(recipient_email, html, 4, jobs_by_platform)
    
    print(f"✅ Test email sent to {recipient_email}")

if __name__ == "__main__":
    test_send_actual_email()