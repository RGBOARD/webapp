import React from 'react';
import './styles/Footer.css'
import SimpleIcon from './SimpleIcon'
import { Linkedin } from 'lucide-react';
const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-item">
          <div>
          Sponsor's Socials:
          </div>
          <div className="social-icons">
            <a href="https://www.x.com/" target="_blank" rel="noopener noreferrer">
              <SimpleIcon name="X" color="#000000"/>
            </a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
              <SimpleIcon name="Instagram" color="#000000"/>
            </a>
            <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">
              <SimpleIcon name="Youtube" color="#000000"/>
            </a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">
              <Linkedin/>
            </a>
          </div>
        </div>
        <div className="footer-item">
          <a href="/faq">FAQ</a>
        </div>
        <div className="footer-item">
          <a href="/privacy">Privacy Policy</a>
        </div>
        <div className="footer-item">
          <a href="/developers">Our Developers</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;