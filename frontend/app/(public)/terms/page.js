

export default function TermsPage() {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-12 bg-white/70 backdrop-blur-md rounded-lg shadow-lg border border-white/20">
        <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
        <p className="text-gray-500 mb-8">Last Updated: March 26, 2025</p>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            Welcome to Next Gig ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your access to and use of the Next Gig website, applications, and services (collectively, the "Service").
          </p>
          <p className="mb-4">
            By accessing or using Next Gig, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Service.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
          <p className="mb-4">
            Next Gig is a job aggregation platform that collects job listings from various third-party job sites and displays them in a unified dashboard for users. We do not create or post job listings ourselves, but rather compile existing listings from public sources.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
          
          <h3 className="text-lg font-medium mb-2">3.1 Registration</h3>
          <p className="mb-4">
            To access certain features of Next Gig, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </p>
          
          <h3 className="text-lg font-medium mb-2">3.2 Account Security</h3>
          <p className="mb-4">
            You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
          
          <h3 className="text-lg font-medium mb-2">3.3 Account Termination</h3>
          <p className="mb-4">
            We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we determine violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. User Conduct</h2>
          <p className="mb-4">You agree not to:</p>
          <ul className="list-disc pl-8 mb-4 space-y-2">
            <li>Use the Service for any illegal purpose or in violation of any laws</li>
            <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
            <li>Attempt to gain unauthorized access to any portion of the Service</li>
            <li>Use automated methods to scrape, harvest, or extract data from the Service</li>
            <li>Impersonate any person or entity or falsely state or misrepresent your affiliation</li>
            <li>Use the Service in any manner that could disable, overburden, damage, or impair the Service</li>
          </ul>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Intellectual Property</h2>
          
          <h3 className="text-lg font-medium mb-2">5.1 Our Content</h3>
          <p className="mb-4">
            The Service and its original content, features, and functionality are and will remain the exclusive property of Next Gig and its licensors. The Service is protected by copyright, trademark, and other laws.
          </p>
          
          <h3 className="text-lg font-medium mb-2">5.2 Third-Party Content</h3>
          <p className="mb-4">
            Job listings displayed on Next Gig are the property of their respective owners. We do not claim ownership of third-party job listings.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Disclaimers</h2>
          
          <h3 className="text-lg font-medium mb-2">6.1 No Employment Relationship</h3>
          <p className="mb-4">
            Next Gig is not an employment agency or hiring service. We do not guarantee employment or verify the accuracy of job listings. Users are solely responsible for verifying the legitimacy of any job opportunity.
          </p>
          
          <h3 className="text-lg font-medium mb-2">6.2 Service Provided "As Is"</h3>
          <p className="mb-4">
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, express or implied, regarding the operation or availability of the Service.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
          <p className="mb-4">
            In no event shall Next Gig be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Indemnification</h2>
          <p className="mb-4">
            You agree to defend, indemnify, and hold harmless Next Gig and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your access to or use of the Service.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Modifications to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these Terms at any time. If we make changes, we will provide notice by updating the "Last Updated" date at the top of these Terms. Your continued use of the Service after such modifications will constitute your acknowledgment and agreement to the modified Terms.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">10. Governing Law</h2>
          <p className="mb-4">
            These Terms shall be governed by the laws of the United Kingdom, without regard to its conflict of law provisions.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">11. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at <a href="mailto:jack@ya-ya.co.uk" className="text-blue-600 hover:underline">jack@ya-ya.co.uk</a>.
          </p>
        </section>
      </div>
    );
  }