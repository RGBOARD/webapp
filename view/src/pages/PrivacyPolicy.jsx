import React from 'react';
import './styles/PrivacyPolicy.css';

const PrivacyPolicy = () => (
  <div className="privacy-page">
    <h2 className="page-title">Privacy Policy</h2>
    <div className="page-desc">
      <h3 className="font-semibold">
        Your privacy is important to us. This policy explains how we collect, use, and protect your information.
      </h3>
    </div>

    <div className="privacy-wrapper card-animation">
      <div className="privacy-container">
        <section className="privacy-section">
          <h3>1. Information We Collect</h3>
          <p>
            We may collect personal information you provide when you sign up (name, email address), plus usage data
            (pages visited, actions taken) to improve our service.
          </p>
        </section>

        <section className="privacy-section">
          <h3>2. How We Use Your Information</h3>
          <p>
            We use your data to authenticate your account, personalize your experience, send you important notices,
            and analyze usage to make RGBoard better.
          </p>
        </section>

        <section className="privacy-section">
          <h3>3. Cookies &amp; Tracking</h3>
          <p>
            We use cookies and similar technologies to remember your settings and understand how you interact with
            our site. You can disable cookies in your browser, but some features may not work.
          </p>
        </section>

        <section className="privacy-section">
          <h3>4. Data Sharing &amp; Disclosure</h3>
          <p>
            We do not sell your personal data. We may share information with third-party services (e.g., hosting,
            analytics) who help us operate—always under contractual confidentiality.
          </p>
        </section>

        <section className="privacy-section">
          <h3>5. Security</h3>
          <p>
            We implement industry-standard measures (encryption, access controls) to protect your data, but no
            system is 100% secure.
          </p>
        </section>

        <section className="privacy-section">
          <h3>6. Your Rights</h3>
          <p>
            You can access, correct, or delete your personal information by visiting your account settings or
            contacting us at{' '}
            <a href="mailto:privacy@yourdomain.com">privacy@yourdomain.com</a>.
          </p>
        </section>

        <section className="privacy-section">
          <h3>7. Changes to This Policy</h3>
          <p>
            We may update this policy periodically. We’ll post the new version here with a revised “Last Updated”
            date.
          </p>
        </section>

        <section className="privacy-section">
          <h3>8. Contact Us</h3>
          <p>
            If you have questions or concerns, reach out at{' '}
            <a href="mailto:privacy@yourdomain.com">privacy@yourdomain.com</a>.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;