import { useNavigate } from 'react-router-dom';
import './styles/LandingPage.css'
import logoImage from '../assets/RGB-Icon.png';
import React from "react";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
      <div className="landing-container">
          <div className="desc-container landing-page-animation">
              <img className= "logo" src={logoImage} alt="RGB Board"/>
              <p className="sponsored">Sponsored by: IEEE Computer Society</p>
              <h1 className="desc-title">What are we about?</h1>
              <p className= "desc">Loremipsum</p>
          </div>
          <div className="choice-container landing-page-animation">
              <button className="landing-buttons py-2 text-base sm:px-6 sm:py-3 sm:text-lg md:px-8 md:py-4 md:text-xl" onClick={() => navigate('/login')}>Log In</button>
              <button className= "landing-buttons py-2 text-base sm:px-6 sm:py-3 sm:text-lg md:px-8 md:py-4 md:text-xl" onClick={() => navigate('/signup')}>Sign Up</button>
          </div>
      </div>
  );
};

export default LandingPage;