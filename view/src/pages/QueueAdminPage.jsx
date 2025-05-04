import "../components/styles/Menu.css";
import "./styles/Upload.css";
import "./styles/UserAdmin.css";
import "./styles/QueueAdmin.css";
import { useAuth } from '../auth/authContext.js';
import { useState, useEffect } from "react";
import Modal from "../components/Modal";
import { formatDateTime } from '../utils/dateUtils';
import { renderPixelDataToImage } from '../utils/pixelRenderer'

function QueueAdminPage() {
  // Rotation Items State
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Scheduled Items State
  const [scheduledItems, setScheduledItems] = useState([]);
  const [scheduledPage, setScheduledPage] = useState(1);
  const [scheduledPages, setScheduledPages] = useState(1);
  const [scheduledTotal, setScheduledTotal] = useState(0);
  
  const { 
    getRotationItems, 
    getScheduledItems, 
    removeFromRotation, 
    removeScheduledItem,
    toggleapproval, 
    updateRotationOrder 
  } = useAuth();

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const fetchImages = async (pageNum) => {
    try {
      const res = await getRotationItems(pageNum);
      const data = res.data;
      
      // Transform data to include rendered pixel data images
      const transformed = data.items.map((item) => {
        let pixelData = {};
        
        // Parse pixel_data if it's a string
        if (item.pixel_data) {
          try {
            pixelData = typeof item.pixel_data === 'string' 
              ? JSON.parse(item.pixel_data) 
              : item.pixel_data;
          } catch (error) {
            console.error('Error parsing pixel data:', error);
          }
        }
        
        // Render pixel data to image URL
        const imageUrl = renderPixelDataToImage(pixelData, 64, 64, 1);
        
        return {
          ...item,
          url: imageUrl
        };
      });
      
      setItems(transformed);
      setPage(data.page);
      setPages(data.pages);
      setTotal(data.total)
    } catch (err) {
      console.error("Failed to load rotation images:", err);
    }
  };
  
  const fetchScheduledItems = async (pageNum) => {
    try {
      const res = await getScheduledItems(pageNum);
      const data = res.data;
      
      // Transform data to include rendered pixel data images
      const transformed = data.items.map((item) => {
        let pixelData = {};
        
        // Parse pixel_data if it's a string
        if (item.pixel_data) {
          try {
            pixelData = typeof item.pixel_data === 'string' 
              ? JSON.parse(item.pixel_data) 
              : item.pixel_data;
          } catch (error) {
            console.error('Error parsing pixel data:', error);
          }
        }
        
        // Render pixel data to image URL
        const imageUrl = renderPixelDataToImage(pixelData, 64, 64, 1);
        
        return {
          ...item,
          url: imageUrl
        };
      });
      
      setScheduledItems(transformed);
      setScheduledPage(data.page);
      setScheduledPages(data.pages);
      setScheduledTotal(data.total)
    } catch (err) {
      console.error("Failed to load scheduled items:", err);
    }
  };

  useEffect(() => {
    fetchImages(page);
  }, [page]);
  
  useEffect(() => {
    fetchScheduledItems(scheduledPage);
  }, [scheduledPage]);

  const handleDelete = async (itemId) => {
    try {
      await removeFromRotation(itemId);
      fetchImages(page);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };
  
  const handleDeleteScheduled = async (itemId) => {
    try {
      await removeScheduledItem(itemId);
      fetchScheduledItems(scheduledPage);
    } catch (err) {
      console.error("Delete scheduled item failed:", err);
    }
  };

  const handleOrderUpdate = async (itemId, newOrder) => {
    try {
      await updateRotationOrder(itemId, newOrder);
      fetchImages(page);
    } catch (err) {
      console.error("Order update failed:", err);
    }
  };

  const handleToggleApproval = async (designId, isApproved) => {
    try {
      await toggleapproval(designId, !isApproved);
      fetchImages(page);
      // Also refresh scheduled items as approval status may affect them
      fetchScheduledItems(scheduledPage);
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
    <div className="useradminpage" >
      <div className="upload-wrapper">
        <h1 className="upload-h1">Administer Queue</h1>
        
        {/* Container for side-by-side tables */}
        <div className="tables-container">
          {/* Active Rotation Items */}
          <div className="table-wrapper">
            <div className="upload-menu-wrapper p-4 h-full">
              <h2 className="text-xl font-bold mb-4">Active Queue Items</h2>
              <div className="user-container">                
                <div className="user-grid">
                  {items.map((item) => (
                    <div key={item.item_id} className="user-card">
                      <img
                        src={item.url}
                        alt="Queued"
                        className="w-16 h-16 rounded-md object-cover"
                      />
                      <div className="queue-info user-info">
                        <div className={`approval-label ${item.is_approved ? 'approved' : 'unapproved'}`}>
                          {item.is_approved ? 'Approved' : 'Unapproved'}
                        </div>
                        <div className="queue-title text-lg">
                          <strong>{item.title}</strong>
                        </div>
                        <div className="text-base">
                          <strong>Duration:</strong> {item.duration} seconds
                        </div>
                        <div className="text-base">
                          <strong>Order:</strong> {" "}
                          <select
                            className="order-select"
                            value={item.display_order}
                            onChange={(e) => {
                              const newPos = Number(e.target.value);
                              showConfirm(
                                `Move item to position ${newPos}?`,
                                () => handleOrderUpdate(item.item_id, newPos)
                              );
                            }}
                          >
                            {Array.from({ length: total }).map((_, idx) => (
                              <option key={idx + 1} value={idx + 1}>
                                {idx + 1}
                              </option>
                            ))}
                          </select>
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
                              "Remove this image from rotation?",
                              () => handleDelete(item.item_id)
                            )
                          }
                        >
                          Remove
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
          
          {/* Scheduled Items */}
          <div className="table-wrapper">
            <div className="upload-menu-wrapper p-4 h-full">
              <h2 className="text-xl font-bold mb-4">Scheduled Items</h2>
              <div className="user-container">
                <div className="user-grid">
                  {scheduledItems.map((item) => (
                    <div key={item.schedule_id} className="user-card">
                      <img
                        src={item.url}
                        alt="Scheduled"
                        className="w-16 h-16 rounded-md object-cover"
                      />
                      <div className="user-info">
                        <div className={`approval-label ${item.is_approved ? 'approved' : 'unapproved'}`}>
                          {item.is_approved ? 'Approved' : 'Unapproved'}
                        </div>
                        <div className="text-lg">
                          <strong>{item.title}</strong>
                        </div>
                        <div className="text-base">
                          <strong>Duration:</strong> {item.duration} seconds
                        </div>
                        <div className="text-base">
                          <strong>Start Time:</strong> {formatDateTime(item.start_time)}
                        </div>
                        <div className="text-base">
                          <strong>End Time:</strong> {formatDateTime(item.end_time)}
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
                              "Remove this item from schedule?",
                              () => handleDeleteScheduled(item.schedule_id)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pagination-container">
                  <div className="pagination">
                    <button
                      onClick={() => setScheduledPage((prev) => Math.max(prev - 1, 1))}
                      disabled={scheduledPage === 1}
                      className="page-button"
                    >
                      &laquo;
                    </button>

                    {Array.from({ length: scheduledPages }, (_, i) => i + 1)
                      .filter((p) => {
                        if (scheduledPages <= 5) return true;
                        if (scheduledPage <= 3) return p <= 5;
                        if (scheduledPage >= scheduledPages - 2) return p >= scheduledPages - 4;
                        return Math.abs(p - scheduledPage) <= 2;
                      })
                      .map((p) => (
                        <button
                          key={p}
                          onClick={() => setScheduledPage(p)}
                          className={`page-button ${scheduledPage === p ? 'active' : ''}`}
                        >
                          {p}
                        </button>
                      ))}

                    <button
                      onClick={() => setScheduledPage((prev) => Math.min(prev + 1, scheduledPages))}
                      disabled={scheduledPage === scheduledPages}
                      className="page-button"
                    >
                      &raquo;
                    </button>
                  </div>
                </div>
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

export default QueueAdminPage;