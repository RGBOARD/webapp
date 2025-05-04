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
  const [scheduleData, setScheduleData] = useState({
    start_time: '',
    end_time: '',
    duration: 60,
    override_current: false
  });
  const [existingScheduleId, setExistingScheduleId] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // fetch design & existing schedule
  useEffect(() => {
    axios.get(`/design/${designId}`)
      .then(res => setDesign(res.data))
      .catch(console.error);

    axios.get('/rotation/scheduled')
      .then(res => {
        const found = res.data.items.find(
          s => s.design_id === Number(designId)
        );
        if (found) {
          setExistingScheduleId(found.schedule_id);
          setScheduleData({
            start_time: found.start_time.slice(0,16),
            end_time:   (found.end_time || '').slice(0,16),
            duration:   found.duration,
            override_current: found.override_current
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
      onConfirm: () => { setModalState(m => ({...m, isOpen:false})); cb(); },
      onCancel:  () => setModalState(m => ({...m, isOpen:false}))
    });
  };

  const handleAddToQueue = async () => {
    const { start_time, end_time, duration, override_current } = scheduleData;

    // --- 1) If no start_time, just add to rotation directly ---
    if (!start_time) {
      try {
        await axios.post('/rotation/add', { design_id: Number(designId) });
        return showAlert('Added to rotation!', () => navigate('/view'));
      } catch (err) {
        console.error(err);
        return showAlert(err.response?.data?.error || 'Error adding to rotation.');
      }
    }

    // --- 2) Otherwise schedule it ---
    let s = start_time;
    let e = end_time;
    // default end_time = +1 day
    if (!e) {
      const d = new Date(s);
      d.setDate(d.getDate() + 1);
      e = d.toISOString().slice(0,16);
    }
    // validate
    if (new Date(e) <= new Date(s)) {
      return showAlert('Error: End time must be after start time.');
    }

    const payload = {
      design_id: Number(designId),
      start_time: s,
      end_time:   e,
      duration:   Number(duration) || 60,
      override_current: override_current ? true : false
    };

    try {
      // if editing, remove the old one first
      if (existingScheduleId) {
        await axios.delete(`/rotation/scheduled/${existingScheduleId}`);
      }
      await axios.post('/rotation/schedule', payload);
      showAlert('Scheduled successfully!', () => navigate('/view'));
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.error || 'Error scheduling design.');
    }
  };

  return (
    <div className="uploadpage">
      <div className="upload-wrapper">
        <h1 className="upload-h1">Schedule Design #{designId}</h1>
        <div className="upload-menu-wrapper">
          {/* scheduling column */}
          <div className="upload-column">
            <ScheduleSection
              scheduleData={scheduleData}
              setScheduleData={setScheduleData}
              onSubmit={handleAddToQueue}
              submitLabel={!scheduleData.start_time ? 'Add to Rotation' : 'Schedule'}
              error={modalState.message}
            />
          </div>

          {/* preview column */}
          <div className="preview-column">
            {design ? (
              <img
                src={renderPixelDataToImage(
                  JSON.parse(design.pixel_data),
                  64, 64, 8
                )}
                alt={design.title}
                className="original-preview"
              />
            ) : (
              <p className="upload-text">Loading preview…</p>
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
