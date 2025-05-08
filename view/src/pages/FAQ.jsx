import React from 'react';
import './styles/FAQ.css';

const faqs = [
  {
    question: "What does this app do?",
    answer: "It lets you upload pixel art, schedule it into a rotation queue, and display it on your board automatically.",
  },
  {
    question: "How do I sign up?",
    answer: "Click the “Sign Up” button in the header, enter your details, then hit “Create Account.”",
  },
  {
    question: "How can I schedule an image to appear?",
    answer:
      "Go to “Upload to Queue,” pick your image, set your start/end times and duration, then click “Schedule.”",
  },
  {
    question: "Where can I manage my saved images?",
    answer:
      "In the user menu select “Upload History” to view, delete, or reschedule any past uploads.",
  },
  {
    question: "I’m an admin—how do I approve images?",
    answer:
      "Admins can go to “Queue Admin” and click “Approve” or “Unapprove” on any pending item.",
  },
  {
    question: "I still can’t find an answer—what now?",
    answer:
      `Drop us a line at <a href="mailto:support@yourdomain.com">support@yourdomain.com</a> and we’ll help you out.`,
  },
];

const FAQ = () => (
  <div className="faq-page">
    <h2 className="page-title">FAQ &amp; Support</h2>
    <div className="page-desc">
      <h3 className="font-semibold">
        Looking for quick answers? Click on a question to expand the answer.
      </h3>
      <h3>
        If you still need help, email us at{' '}
        <a href="mailto:support@yourdomain.com">support@yourdomain.com</a>.
      </h3>
    </div>

    <div className="faq-wrapper card-animation">
      <div className="faq-container">
        {faqs.map(({ question, answer }, idx) => (
          <details key={idx} className="faq-item">
            <summary>{question}</summary>
            <div
              className="faq-answer"
              dangerouslySetInnerHTML={{ __html: answer }}
            />
          </details>
        ))}
      </div>
    </div>
  </div>
);

export default FAQ;
