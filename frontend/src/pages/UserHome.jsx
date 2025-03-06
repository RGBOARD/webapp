import React from 'react';
import ActionButton from '../components/ActionButton.jsx'
import '../components/styles/Menu.css'

function UserHome() {
  return (
    <div className="menu-wrapper">
      <div className="welcome-column">
        <div className="welcome-text">
          <h1>Hello User!</h1>
          <p>What would you like to do?</p>
        </div>
      </div>
      <div className="menu-column">
        <div className="button-menu">
          <ActionButton 
            icon="upload" 
            text="Upload an Image to the Queue"
            route="/upload"
          />
          <ActionButton 
            icon="create" 
            text="Create an Image for the Queue"
            route="/create"
          />
          <ActionButton 
            icon="view" 
            text="View your Queued Images"
            route="/view"
          />
        </div>
      </div>
    </div>
  )
}

export default UserHome;