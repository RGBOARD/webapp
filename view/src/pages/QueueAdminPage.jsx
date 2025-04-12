import "../components/styles/Menu.css";
import "./styles/Upload.css";
import "./styles/UserAdmin.css";
import "./styles/QueueAdmin.css";
import { useAuth } from '../auth/authContext.js';
import { useState, useEffect } from "react";
import Modal from "../components/Modal";
import Carousel from "../components/Carousel.jsx";

function QueueAdminPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const { getpageimages, deletequeueitem, toggleapproval } = useAuth();

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const fetchImages = async (pageNum) => {
    try {
      const res = await getpageimages(pageNum);
      const data = res.data;
      const transformed = data.items.map((item) => ({
        ...item,
        url: `data:image/jpeg;base64,${item.image}`
      }));
      setItems(transformed);
      setPage(data.page);
      setPages(data.pages);
    } catch (err) {
      console.error("Failed to load queue images:", err);
    }
  };

  useEffect(() => {
    fetchImages(page);
  }, [page]);

  const handleDelete = async (queueId) => {
    try {
      await deletequeueitem(queueId);
      fetchImages(page);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleToggleApproval = async (designId, isApproved) => {
    try {
      await toggleapproval(designId, !isApproved);
      fetchImages(page);
    } catch (err) {
      console.error("Toggle approval failed:", err);
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
        <h1 className="upload-h1">Queue Admin</h1>
        <div className="upload-menu-wrapper p-4">
          <div className="user-container">
            <div className="user-grid">
              {items.map((item) => (
                <div key={item.queue_id} className="user-card">
                  <img
                    src={item.url}
                    alt="Queued"
                    className="w-28 h-28 rounded-md mx-4 object-cover"
                  />
                  <div className="user-info mx-4">
                    <div className={`approval-label ${item.is_approved ? 'approved' : 'unapproved'}`}>
                      {item.is_approved ? 'Approved' : 'Unapproved'}
                    </div>
                    <div className="text-lg">
                      <strong>{item.title}</strong>
                    </div>
                    <div className="text-base">
                      <strong>Scheduled at:</strong> {item.start_time || 'Unscheduled'}
                    </div>
                    <div className="text-base">
                      <strong>Order:</strong> {item.display_order}
                    </div>
                  </div>
                  <div className="user-buttons">
                    <button
                        className="toggle-button"
                        onClick={() =>
                            showConfirm(
                          item.is_approved
                            ? "Unapprove this design?"
                            : "Approve this design?",
                          () => handleToggleApproval(item.design_id, item.is_approved)
                        )
                      }
                    >
                      {item.is_approved ? "Unapprove" : "Approve"}
                    </button>
                    <button
                      className="delete-button"
                      onClick={() =>
                        showConfirm(
                          "Delete this queued image?",
                          () => handleDelete(item.queue_id)
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
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

                {Array.from({ length: pages }, (_, i) => i + 1)
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
      <Carousel userRole="user" />
    </div>
  );
}

export default QueueAdminPage;
