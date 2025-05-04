import React from 'react';
import './styles/Footer.css'
import './styles/Developer.css';
import { Linkedin } from 'lucide-react';

const Developer = ({ name, degree, excerpt, photo, linkedin, borderColor }) => {
  return (
      <div className={`developer-card ${borderColor}`}>
          {photo && <img src={photo} alt={`${name}'s photo`} className="developer-photo"/>}
          <div className="dev-name">
              <h3>{name}</h3>
              <a href={linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin/>
              </a>
          </div>
          <p className="dev-degree">{degree}</p>
          <p className="dev-excerpt">{excerpt}</p>
      </div>
  );
};

export default Developer;
