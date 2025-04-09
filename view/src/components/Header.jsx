import React, { useEffect, useState } from 'react';
import './styles/Header.css'
import logoImage from '../assets/RGB-Icon.png';
import { Menu, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth/authContext';
import { useNavigate, useLocation } from 'react-router-dom';

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [previousPaths, setPreviousPaths] = useState([]);
  
  // Track navigation history
  useEffect(() => {
    setPreviousPaths(prev => {
      // Don't add duplicate entries for the same path
      if (prev.length > 0 && prev[prev.length - 1] === location.pathname) {
        return prev;
      }
      return [...prev, location.pathname].slice(-5); // Keep last 5 paths
    });
  }, [location.pathname]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleHome = () => {
    navigate('/');
  };
  
  const handleBack = () => {
    const prevPath = previousPaths.length > 1 
      ? previousPaths[previousPaths.length - 2] 
      : '/';
    
    // Logic for handling back button behavior
    if (prevPath === '/login' && isAuthenticated) {
      // If going back to login while authenticated, go to home instead
      navigate('/');
    } else if (prevPath === '/signup' && isAuthenticated) {
      // If going back to signup while authenticated, go to home instead
      navigate('/');
    } else if (prevPath === location.pathname) {
      // If somehow the previous path is the current path, go to home
      navigate('/');
    } else {
      // Normal back navigation
      navigate(-1);
    }
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <div className="left-actions">
          <div className="action-icon back-button" onClick={handleBack}>
            <ArrowLeft />
          </div>
        </div>
        
        <div className="logo" onClick={handleHome} style={{ cursor: 'pointer' }}>
          <img src={logoImage} alt="RGB Board" />
        </div>
        
        <div className="right-actions">
          {isAuthenticated && (
            <div className="action-icon" onClick={handleLogout}>
              <LogOut/>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header;