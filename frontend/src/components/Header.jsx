import React from 'react';
import './styles/Header.css'
import logoImage from '../assets/RGB-Icon.png';
import { Menu, LogOut } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';

function Header() {
  const { isAuthenticated, logout } = useAuth0();
  
  const handleLogout = () => {
    logout({ returnTo: window.location.origin + '/login' });
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <div className="menu-icon">
          <Menu/>
        </div>
        
        <div className="logo">
          <img src={logoImage} alt="RGB Board" />
        </div>
        
        {isAuthenticated && (
          <div className="action-icon" onClick={handleLogout}>
            <LogOut/>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header;