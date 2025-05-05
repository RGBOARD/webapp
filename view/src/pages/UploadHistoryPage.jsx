import React, { useState, useEffect } from 'react';
import "../components/styles/Menu.css";
import "./styles/Upload.css";
import "./styles/UserAdmin.css";
import "./styles/QueueAdmin.css";
import { useAuth } from '../auth/authContext.js';
import { renderPixelDataToImage } from '../utils/pixelRenderer';
import { formatDateTime } from "../utils/dateUtils.jsx";

export default function UploadHistoryPage() {
  const { getPageUploadHistory } = useAuth();
  const [history, setHistory] = useState([]);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchPage = async (pageNum) => {
    setLoading(true);
    const res = await getPageUploadHistory(pageNum);
    if (!res.success) {
      setError(res.error);
    } else {
      const { items, page: p, pages: totalPages } = res.data;
      // render pixel_data → image URL
      const transformed = items.map(item => {
        let pd = {};
        if (item.pixel_data) {
          try {
            pd = typeof item.pixel_data === 'string'
              ? JSON.parse(item.pixel_data)
              : item.pixel_data;
          } catch {}
        }
        return { ...item, url: renderPixelDataToImage(pd, 64, 64, 1) };
      });
      setHistory(transformed);
      setPage(p);
      setPages(totalPages);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPage(page);
  }, [page]);

  if (loading) return <p className="upload-p">Loading your uploads…</p>;
  if (error)   return <p className="upload-p" style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div className="useradminpage">
      <div className="upload-wrapper">
        <h1 className="upload-h1">Your Upload History</h1>
        <div className="upload-menu-wrapper p-4">
          <div className="user-container">
            <div className="user-grid">
              {history.map(item => (
                <div key={item.history_id} className="user-card">
                  <img
                    src={item.url}
                    alt={item.title || 'Upload'}
                    className="w-28 h-28 rounded-md mx-4 object-cover"
                  />
                  <div className="queue-info mx-4">
                    <div className="text-lg">
                      <strong>{item.title || 'Untitled'}</strong>
                    </div>
                    <div className="text-base">
                      <strong>Created at:</strong> {formatDateTime(item.attempt_time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination controls */}
            <div className="pagination-container">
              <div className="pagination">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="page-button"
                >&laquo;</button>

                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter(p => {
                    if (pages <= 5) return true;
                    if (page <= 3)   return p <= 5;
                    if (page >= pages - 2) return p >= pages - 4;
                    return Math.abs(p - page) <= 2;
                  })
                  .map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`page-button ${page === p ? 'active' : ''}`}
                    >{p}</button>
                  ))}

                <button
                  onClick={() => setPage(p => Math.min(p + 1, pages))}
                  disabled={page === pages}
                  className="page-button"
                >&raquo;</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
