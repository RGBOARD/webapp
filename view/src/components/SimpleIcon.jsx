import React from 'react';
import * as SimpleIcons from 'simple-icons';

function SimpleIcon({ name, color, size = 24}) {
  // Get the icon by its slug
  const icon = SimpleIcons[`si${name}`];

  if (!icon) {
    console.error(`Icon "${name}" not found`);
    return null;
  }
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={color || `#${icon.hex}`}
    >
      <path d={icon.path} />
    </svg>
  );
}

export default SimpleIcon;