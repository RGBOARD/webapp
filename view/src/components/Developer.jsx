import React from 'react';
import './styles/Footer.css'
import './styles/Developer.css';
import { Linkedin } from 'lucide-react';

const Developer = ({ name, degree, excerpt, photo, linkedin, borderColor }) => {
  return (
      <div className={`developer-card ${borderColor}`}>
          <div className="photo-block">
              {photo && <img src={photo} alt={`${name}'s photo`} className="developer-photo"/>}
              <a href={linkedin} className="linkedin-link" target="_blank" rel="noopener noreferrer">
                  <Linkedin/>
              </a>
          </div>
          <h3 className="dev-name">{name}</h3>
          <p className="dev-degree">{degree}</p>
          <p className="dev-excerpt">{excerpt}</p>
      </div>
  );
};

export default Developer;
