# email_service/test_template.py

from send_email import generate_html_email
from collections import defaultdict

def test_email_template():
    """Test the HTML email template with sample data"""
    # Sample job data
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
    
    # Write to file for inspection
    with open("test_email.html", "w") as f:
        f.write(html)
    
    print("✅ Test email template generated as test_email.html")
    print("Open test_email.html in your browser to preview the email design")

if __name__ == "__main__":
    test_email_template()