import React from 'react';
import './styles/ActionButton.css';
import { useNavigate } from 'react-router-dom';
import { Upload, Image, Eye, Archive, Users } from 'lucide-react';

const ActionButton = ({ icon, text, route }) => {
  const navigate = useNavigate();

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'upload':
        return <Upload className="h-5 w-5" />;
      case 'create':
        return <Image className="h-5 w-5" />;
      case 'view':
        return <Eye className="h-5 w-5" />;
      case 'quote':
        return <Archive className="h-5 w-5" />;
      case 'users':
        return <Users className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const handleClick = () => {
    if (route) {
      navigate(route);
    }
  };

  return (
    <button 
      className="action-button" 
      onClick={handleClick}
    >
      <div className="icon-container">
        {getIcon(icon)}
      </div>
      <span className="button-text">{text}</span>
    </button>
  );
};

export default ActionButton;