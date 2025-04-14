import "../components/styles/Menu.css";
import "./styles/Upload.css";
import "./styles/UserAdmin.css";
import { useAuth } from '../auth/authContext.js'
import {useState, useEffect} from "react";
import { CircleUser } from 'lucide-react';

import Modal from "../components/Modal";
import { formatDateTime } from '../utils/dateUtils';

function UserAdminPage() {


  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const { getpageusers, deleteuser, currentUser, toggleadmin } = useAuth();

   const [modalState, setModalState] = useState({
        isOpen: false,
        type: null,
        message: '',
        onConfirm: () => {},
        onCancel: () => {}
  });

  const fetchUsers = async (pageNum) => {
    try {
      const res = await getpageusers(pageNum);
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

  const showConfirm = (message, onConfirm, onCancel = () => {}) => {
    setModalState({
      isOpen: true,
      type: 'confirm',
      message,
      onConfirm: () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        onCancel();
      }
    });
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
                      <CircleUser className="user-icon w-18 h-18 mx-4"/>
                      <div className="user-info mx-4">
                        {user.is_admin === 1 && (
                            <div className="role-label">
                              <strong>Admin</strong>
                            </div>
                        )}
                        <div>
                          <strong>{user.email}</strong>
                        </div>
                        <div>
                          {formatDateTime(user.created_at)}
                        </div>
                      </div>
                      <div className="user-buttons">
                        {!isCurrentUser ? (
                            <>
                              <button
                                  className="delete-button"
                                  onClick={() => showConfirm("Would you like to delete this user?", () => handleDelete(user.user_id))}
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

            <div className="pagination-container">
              <div className="pagination">

                <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="page-button"
                >
                  &laquo;
                </button>

                {Array.from({length: pages}, (_, i) => i + 1)
                    .filter((p) => {
                      if (pages <= 5) return true;
                      if (page <= 3) return p <= 5;
                      if (page >= pages - 2) return p >= pages - 4;
                      return Math.abs(p - page) <= 2;
                    })
                    .map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`page-button ${page === p ? 'active' : ''}`}
                        >
                          {p}
                        </button>
                    ))}

                {/* Next Arrow */}
                <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
                    disabled={page === pages}
                    className="page-button"
                >
                  &raquo;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
          isOpen={modalState.isOpen}
          type={modalState.type}
          message={modalState.message}
          onConfirm={modalState.onConfirm}
          onCancel={modalState.onCancel}
      />
    </div>
  );
}

export default UserAdminPage;