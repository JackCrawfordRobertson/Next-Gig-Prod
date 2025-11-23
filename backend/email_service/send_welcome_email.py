"""
Welcome Email Service
Sends a welcome email to new users when they sign up
"""

import resend
import os
from pathlib import Path
from typing import Optional

# Initialize Resend with API key
resend.api_key = os.environ.get("RESEND_API_KEY")

def send_welcome_email(
    user_email: str,
    first_name: str = "there"
) -> bool:
    """
    Send a welcome email to a new user

    Args:
        user_email: The user's email address
        first_name: The user's first name (default: "there")

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Read the HTML template
        template_path = Path(__file__).parent / "templates" / "welcome_email.html"

        with open(template_path, 'r', encoding='utf-8') as f:
            html_template = f.read()

        # Replace template variables
        html_content = html_template.replace("{{first_name}}", first_name)
        html_content = html_content.replace("{{email}}", user_email)

        # Send the email using Resend
        params = {
            "from": "Next Gig <hello@next-gig.co.uk>",
            "to": [user_email],
            "subject": f"Welcome to Next Gig, {first_name}! 🎉",
            "html": html_content,
            "reply_to": "hello@next-gig.co.uk"
        }

        response = resend.Emails.send(params)

        print(f"✅ Welcome email sent successfully to {user_email}")
        print(f"   Email ID: {response.get('id', 'N/A')}")

        return True

    except FileNotFoundError:
        print(f"❌ Error: Welcome email template not found at {template_path}")
        return False

    except Exception as e:
        print(f"❌ Error sending welcome email to {user_email}: {str(e)}")
        return False


def send_bulk_welcome_emails(users: list[dict]) -> dict:
    """
    Send welcome emails to multiple users

    Args:
        users: List of dicts with 'email' and 'first_name' keys

    Returns:
        dict: Summary with success/failure counts
    """
    results = {
        "success": 0,
        "failed": 0,
        "total": len(users)
    }

    for user in users:
        email = user.get("email")
        first_name = user.get("first_name", "there")

        if not email:
            print(f"⚠️  Skipping user with no email: {user}")
            results["failed"] += 1
            continue

        success = send_welcome_email(email, first_name)

        if success:
            results["success"] += 1
        else:
            results["failed"] += 1

    print(f"\n📊 Welcome Email Summary:")
    print(f"   Total: {results['total']}")
    print(f"   Sent: {results['success']}")
    print(f"   Failed: {results['failed']}")

    return results


# Example usage
if __name__ == "__main__":
    # Test sending a welcome email
    test_email = "test@example.com"
    test_name = "John"

    print(f"Testing welcome email to {test_email}...")
    send_welcome_email(test_email, test_name)
