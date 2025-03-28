import ActionButton from "../components/ActionButton.jsx";
import Carousel from '../components/Carousel.jsx'
import "../components/styles/Menu.css";
import { useAuth } from '../auth/authContext.js'

function UserHome() {
  const { currentUser } = useAuth();
  const username = currentUser?.name || currentUser?.username || currentUser?.sub || "User";
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

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
      <Carousel userRole="user"/>
    </div>
  );
}

export default UserHome;
