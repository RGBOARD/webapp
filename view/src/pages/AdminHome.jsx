import React from 'react';
import ActionButton from '../components/ActionButton';
import Carousel from '../components/Carousel';
import '../components/styles/Menu.css';
import { useAuth } from '../auth/authContext';

function AdminHome() {
  const { currentUser } = useAuth();
  const username = currentUser?.name || currentUser?.username || currentUser?.sub || "User";
  const displayName = username.charAt(0).toUpperCase() + username.slice(1).split(".")[0];

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
            <ActionButton
              icon="history"
              text="View Upload History"
              route="/upload-history"
            />
            <ActionButton
              icon="quote"
              text="Manage Queue"
              route="/queue-admin"
            />
            <ActionButton
              icon="users"
              text="Manage Users"
              route="/user-admin"
            />
          </div>
        </div>
      </div>

      {/* Show the upcoming images carousel */}
      <Carousel userRole="admin" />
    </div>
  );
}

export default AdminHome;