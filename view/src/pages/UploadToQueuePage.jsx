import ScheduleSection from "../components/ScheduleSection";
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from '../api/axios';
import Modal from '../components/Modal';
import { renderPixelDataToImage } from '../utils/pixelRenderer';
import './styles/UploadToQueuePage.css';

export default function UploadToQueuePage() {
  const { designId } = useParams();
  const navigate = useNavigate();

  const [design, setDesign] = useState(null);
  const [scheduleData, setScheduleData] = useState({ start_time: '', end_time: '' });
  const [existingItemId, setExistingItemId] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: () => {}, onCancel: () => {} });
  const [queueMessage, setQueueMessage] = useState('');

  useEffect(() => {
    axios.get(`/design/${designId}`)
      .then(res => setDesign(res.data))
      .catch(console.error);

    axios.get('/queue_item')
      .then(res => {
        const existing = res.data.find(
          item => item.design_id === Number(designId) && item.scheduled
        );
        if (existing) {
          setExistingItemId(existing.queue_id);
          const toInput = s => s.substring(0, 16);
          setScheduleData({
            start_time: toInput(existing.start_time),
            end_time:   toInput(existing.end_time)
          });
        }
      })
      .catch(console.error);
  }, [designId]);

  const showAlert = (message, cb = () => {}) => {
    setModalState({
      isOpen: true,
      type: 'alert',
      message,
      onConfirm: () => { setModalState(prev => ({ ...prev, isOpen: false })); cb(); },
      onCancel:  () => { setModalState(prev => ({ ...prev, isOpen: false })); }
    });
  };

  const handleAddToQueue = async () => {
    let { start_time, end_time } = scheduleData;
    if (!(start_time && end_time)) {
      const now = new Date(),
            nextStart = new Date(now.getTime() + 60000),
            nextEnd   = new Date(nextStart.getTime() + 86400000);
      start_time = nextStart.toISOString().slice(0,16);
      end_time   = nextEnd.toISOString().slice(0,16);
    }
    if (new Date(end_time) <= new Date(start_time)) {
      return showAlert('Error: End time must be after start time.');
    }

    const payload = {
      design_id: Number(designId),
      start_time,
      end_time,
      display_duration: 60,
      scheduled: 1,
      scheduled_at: new Date().toISOString()
    };

    try {
      if (existingItemId) {
        await axios.put(`/queue_item/${existingItemId}`, payload);
      } else {
        await axios.post('/queue_item', payload);
      }
      setQueueMessage('Scheduled successfully.');
      navigate('/view');
    } catch (err) {
      console.error(err);
      showAlert('Error adding image to queue.');
    }
  };

  return (
    <div className="uploadpage">
      <div className="upload-wrapper">
        <h1 className="upload-h1">Schedule Design #{designId}</h1>
        <div className="upload-menu-wrapper">
          {/* Scheduling column */}
          <div className="upload-column">
            {queueMessage && <div className="upload-text text-red-500 mb-2">{queueMessage}</div>}
            <ScheduleSection
              scheduleData={scheduleData}
              setScheduleData={setScheduleData}
              onSubmit={handleAddToQueue}
              submitLabel="Add to Queue"
              error={queueMessage}
            />
          </div>

          {/* Preview column - only pixel preview */}
          <div className="preview-column">
            {design ? (
              <>
                <p className="upload-text mb-2 text-center"></p>
                <img
                  src={renderPixelDataToImage(
                    JSON.parse(design.pixel_data),
                    64, 64, 8
                  )}
                  alt={design.title}
                  className="pixelated-preview"
                />
              </>
            ) : (
              <p className="upload-text">Loading preview...</p>
            )}
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
