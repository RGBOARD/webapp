import React from 'react';
import './styles/Header.css'
import logoImage from '../assets/RGB-Icon.png';
import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Header({ onLogout }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }

    localStorage.removeItem('userRole');
    navigate('/login');
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
        
        <div className="action-icon" onClick={handleLogout}>
          <LogOut/>
        </div>
      </div>
    </header>
  )
}

export default Header;