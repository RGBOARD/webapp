import ActionButton from '../components/ActionButton'
import Carousel from '../components/Carousel'
import '../components/styles/Menu.css'
import { useAuth } from '../auth/authContext'

function AdminHome() {
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
            <ActionButton 
              icon="quote" 
              text="Queue Admin"
              route="/queue-admin"
            />
            <ActionButton 
              icon="users" 
              text="User Admin"
              route="/user-admin"
            />
          </div>
        </div>
      </div>
      <Carousel userRole="admin"/>
    </div>
  )
}

export default AdminHome;