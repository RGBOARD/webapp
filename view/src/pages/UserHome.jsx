import React, { useEffect, useState } from "react";
import ActionButton from "../components/ActionButton";
import Carousel from '../components/Carousel';
import "../components/styles/Menu.css";
import VerifyForm from '../components/VerifyForm';
import { useAuth } from '../auth/authContext';
import { useLocation } from 'react-router-dom';
import axios from '../api/axios';

async function checkVerification() {
  const response = await axios.get('/is-email-verified');
  return response.status === 200;
}

function UserHome() {
  const { currentUser } = useAuth();
  const username = currentUser?.name || currentUser?.username || currentUser?.sub || "User";
  const displayName = username.charAt(0).toUpperCase() + username.slice(1).split(".")[0];
  const [isVerified, setIsVerified] = useState(null);
  const location = useLocation();
  
  useEffect(() => {
    async function fetchVerification() {
      const verified = await checkVerification();
      setIsVerified(verified);
    }
    
    if (isVerified === null || location.state?.justVerified) {
      fetchVerification().catch(error => {
        console.error("Verification check failed:", error);
        setIsVerified(false);
      });
    }
  }, [location.state, isVerified]);

  if (isVerified) {
    return (
      <div className="homepage">
        <div className="menu-wrapper">
          <div className="welcome-column">
            <div className="welcome-text">
              <h1>Hello {displayName}!</h1>
              <p>What would you like to do?</p>
            </div>
          </div>
          <div className="menu-column">
            <div className="button-menu">
              <ActionButton
                icon="upload"
                text="Save Image"
                route="/upload"
              />
              <ActionButton
                icon="create"
                text="Create Image"
                route="/create"
              />
              <ActionButton
                icon="view"
                text="View Saved Images"
                route="/view"
              />
            </div>
          </div>
        </div>
        
        {/* Show the upcoming images carousel */}
        <Carousel userRole="user" />
      </div>
    );
  } else {
    return (
      <VerifyForm />
    );
  }
}

export default UserHome;