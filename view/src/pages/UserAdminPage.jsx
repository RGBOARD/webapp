import "../components/styles/Menu.css";
import "../components/styles/Upload.css";
import "../components/styles/UserAdmin.css";
import { useAuth } from '../auth/authContext.js'
import {useState, useEffect} from "react";
import { CircleUser } from 'lucide-react';

function UserAdminPage() {


  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const pageSize = 10;
  const { getpageusers, deleteuser, currentUser, toggleadmin } = useAuth();

  const fetchUsers = async (pageNum) => {
    try {
      const res = await getpageusers(pageNum,pageSize);
      setUsers(res.data.users);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleDelete = async (userId) => {
    try {
      await deleteuser(userId);
      fetchUsers(page);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const toggleAdmin = async (userId, isAdmin) => {
    try {
      await toggleadmin(userId, isAdmin);
      fetchUsers(page);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div className="useradminpage">
      <div className="upload-wrapper">
        <h1 className="upload-h1">Administer Users</h1>
        <div className="upload-menu-wrapper p-4">
          <div className="user-container">
            <div className="user-grid">
              {users.map((user) => {
                const isCurrentUser = user.user_id === currentUser?.user_id;
                const cardClass = `user-card ${
                  isCurrentUser ? 'current-user' : user.is_admin ? 'admin' : ''
                }`;

                return (
                  <div key={user.user_id} className={cardClass}>
                    <div className="user-info">
                      {/* Place the icon beside the user information */}
                      <CircleUser className="user-icon" />
                      <div>
                        <strong>User ID:</strong> {user.user_id}
                      </div>
                      <div>
                        <strong>Email:</strong> {user.email}
                      </div>
                      <div>
                        <strong>Is Admin:</strong> {user.is_admin ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="user-buttons">
                      {!isCurrentUser ? (
                        <>
                          <button
                            className="delete-button"
                            onClick={() => handleDelete(user.user_id)}
                          >
                            Delete
                          </button>
                          <button
                            className="toggle-button"
                            onClick={() => toggleAdmin(user.user_id, !user.is_admin)}
                          >
                            {user.is_admin ? 'Demote' : 'Promote'}
                          </button>
                        </>
                      ) : (
                        <span className="you-text">(You)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination container outside the scrollable area */}
            <div className="pagination-container">
              <div className="pagination">
                {[...Array(pages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPage(idx + 1)}
                    className={`page-button ${page === idx + 1 ? 'active' : ''}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserAdminPage;