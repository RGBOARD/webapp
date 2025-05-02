import { useNavigate } from 'react-router-dom';
import './styles/LandingPage.css'
import logoImage from '../assets/RGB-Icon.png';
import React from "react";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
      <div className="landing-container">
          <div className="desc-container landing-page-animation">
              <img className= "landing-logo" src={logoImage} alt="RGB Board"/>
              <p className="sponsored font-bold">Sponsored by:</p>
              <p className="sponsored bold">IEEE Computer Society – Student Branch, University of Puerto Rico at Mayagüez</p>
              <h1 className="desc-title">What are we about?</h1>
              <p className= "desc">
                  RGBoard provides a dynamic, engaging, and simple to understand system
                  that allows its users to to engage with each other and the wider community of people
                  that view the images and ads displayed in the board. Using the RGBoard site you can upload
                  flyers or image ads and have them be displayed in the RGBoard’s LED Board. Being able to display
                  ads and reach out to students in a fuss-less and convenient way.
              </p>
          </div>
          <div className="choice-container landing-page-animation">
              <button className="landing-buttons" onClick={() => navigate('/login')}>Log In</button>
              <button className= "landing-buttons" onClick={() => navigate('/signup')}>Sign Up</button>
          </div>
      </div>
  );
};

export default LandingPage;