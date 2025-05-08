import React from 'react';
import './styles/FAQ.css';

const faqs = [
  {
    question: 'What is RGBoard?',
    answer:
      'RGBoard is a simple, dynamic platform where you can upload flyers or image ads and schedule them to display on our LED board—making it easy to reach students and your community.',
    color: '#e74c3c',
  },
  {
    question: 'Supported image formats and best-practice guidelines?',
    answer:
      'We support most common image formats. For best results, use square images (1:1 aspect ratio) with clear, non-blurry visuals, large readable fonts, and vibrant colors.',
    color: '#e74c3c',
  },
  {
    question: 'How do I create an account?',
    answer:
      'Click <strong>Sign In</strong> and enter your UPR credentials. After signing in, you will be redirected to the login page. Once you enter your credentials, you’ll be asked to verify your account. Check your email from <a href="mailto:noreply@rgboard.org">noreply@rgboard.org</a> for your verification code, then enter it on the site. Once verified, you’re all set to start using RGBoard.',
    color: '#2ecc71',
  },
  {
    question: 'How do I schedule or add my design to the rotation?',
    answer:
      'After uploading your design, go to <strong>View Saved Images</strong>, select your design, and click the queue button to set a start time, then hit <strong>Schedule</strong>. If you want to queue the design without setting a start time, simply leave it empty and click <strong>Add to Rotation</strong>.',
    color: '#2ecc71',
  },
  {
    question: 'How can I delete, reschedule, or edit my designs?',
    answer:
      'Yes—go to <strong>View Saved Images</strong>, find your design, and you’ll see options to delete it, edit its schedule, or modify the design using our integrated pixel art editor.',
    color: '#3498db',
  },
  {
    question: 'Where can I get more help?',
    answer:
      'Still stuck? Email us at <a href="mailto:computersociety@uprm.edu">computersociety@uprm.edu</a>.',
    color: '#3498db',
  },
];

export default function FAQ() {
  return (
    <div className="faq-page">
      <h2 className="faq-title">Frequently Asked Questions</h2>
      <p className="faq-intro">
        Need help navigating RGBoard? This page covers the basics of account setup, uploading, scheduling, and editing your designs.
      </p>

      <div className="faq-grid">
        {faqs.map((item, idx) => (
          <div key={idx} className="faq-card">
            <span
              className="faq-bullet"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <p className="faq-question">{item.question}</p>
              <p
                className="faq-answer"
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
