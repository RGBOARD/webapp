import React from 'react';
import './styles/PrivacyPolicy.css';

const policies = [
  {
    title: 'Information We Collect',
    description:
      'We collect the UPR credentials you enter (email & encrypted password), one-time verification codes, and any data you provide when uploading or creating images (pixel data, file metadata, scheduling details).',
  },
  {
    title: 'How We Use Your Data',
    description:
      'Your information powers account authentication, our scheduling engine, and email notifications (e.g., verification codes). Aggregate usage logs help us optimize features and maintain reliability.',
  },
  {
    title: 'Cookies & Sessions',
    description:
      'We use cookies and session storage to keep you signed in and remember your preferences. You can clear or block cookies in your browser, but you may need to log in again to access all features.',
  },
  {
    title: 'Media & Storage',
    description:
      'Uploaded images and their pixel data are stored in our database. Expired or deleted images are purged automatically to free space.',
  },
  {
    title: 'Data Sharing',
    description:
      'We do <strong>not</strong> sell your personal information. We share only what’s necessary with our email service (to send verification codes) and our hosting provider under strict confidentiality agreements.',
  },
  {
    title: 'Security & Your Rights',
    description:
      'We protect data using HTTPS, encrypted passwords, and parameterized database queries. You can access, correct, or delete your personal data by emailing <a href="mailto:computersociety@uprm.edu">computersociety@uprm.edu</a>.',
  },
];

// cycle through these colors for each section’s border
const COLORS = ['#e74c3c', '#2ecc71', '#3498db'];

export default function PrivacyPolicy() {
  return (
    <div className="policy-page">
      <h2 className="policy-title">Privacy Policy</h2>
      <p className="policy-desc">
        Your privacy is important to us. This policy explains what data we collect, how we use it, and your rights as a user of RGBoard.
      </p>

      <div className="policy-container">
        {policies.map((sec, i) => (
          <details key={i} className="policy-section">
            <summary
              className="policy-summary"
              style={{ borderLeft: `5px solid ${COLORS[i % COLORS.length]}` }}
            >
              {sec.title}
            </summary>
            <div
              className="policy-text"
              dangerouslySetInnerHTML={{ __html: sec.description }}
            />
          </details>
        ))}
      </div>
    </div>
  );
}
