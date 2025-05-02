import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import CanvasImage from '../components/CanvasImage';

export default function UploadHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    useEffect(() => {
      async function load() {
        try {
          const { data } = await axios.get('/upload_history');
          setHistory(data);
        } catch (e) {
          console.error(e);
          setError(e);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, []);


  if (loading) return <p>Loading your uploads…</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error.message}</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Your Upload History</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '1rem',
          marginTop: '1rem'
        }}
      >
        {history.map(item => (
          <div
            key={item.history_id}
            style={{
              border: '1px solid #eee',
              borderRadius: '4px',
              padding: '0.5rem',
              textAlign: 'center'
            }}
          >
            <CanvasImage pixelData={item.pixel_data} maxSize={120} />
            <h4 style={{ margin: '0.5rem 0 0.25rem' }}>
              {item.title || 'Untitled'}
            </h4>
            <small>
              {new Date(item.attempt_time).toLocaleString()}
            </small>
            <div>
              <em>Status:</em> {item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
