import React, { useState, useEffect } from 'react';
import "../components/styles/Menu.css";
import "./styles/Upload.css";
import "./styles/UserAdmin.css";
import "./styles/QueueAdmin.css";
import axios from '../api/axios';
import { renderPixelDataToImage } from '../utils/pixelRenderer';
import {formatDateTime} from "../utils/dateUtils.jsx";

export default function UploadHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await axios.get('/upload_history');
        const transformed = data.map(item => {
          let pixelData = {};
          if (item.pixel_data) {
            try {
              pixelData = typeof item.pixel_data === 'string'
                ? JSON.parse(item.pixel_data)
                : item.pixel_data;
            } catch (e) {
              console.error('Error parsing pixel_data:', e);
            }
          }
          const url = renderPixelDataToImage(pixelData, 64, 64, 1);
          return { ...item, url };
        });
        setHistory(transformed);
      } catch (e) {
        console.error(e);
        setError(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="upload-p">Loading your uploads…</p>;
  if (error) return <p className="upload-p" style={{ color: 'red' }}>Error: {error.message}</p>;

  return (
    <div className="useradminpage">
      <div className="upload-wrapper">
        <h1 className="upload-h1">Your Upload History</h1>
        <div className="upload-menu-wrapper p-4">
          <div className="user-container">
            <div className="user-list">
              {history.map(item => (
                <div key={item.history_id} className="user-card">
                  {/* Match QueueAdmin image styling */}
                  <img
                    src={item.url}
                    alt={item.title || 'Upload'}
                    className="w-28 h-28 rounded-md mx-4 object-cover"
                  />
                  <div className="user-info mx-4">
                    <div className="text-lg">
                      <strong>{item.title || 'Untitled'}</strong>
                    </div>
                    <div className="text-base">
                        <strong>Created at:</strong>{" "}{formatDateTime( item.attempt_time)}
                    </div>
                  </div>
                  <div className="user-buttons" style={{ visibility: 'hidden' }}>
                    <button className="toggle-button">Approve</button>
                    <button className="delete-button">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
