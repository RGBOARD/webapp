import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/authContext.js';
import axios from '../api/axios';
import Modal from '../components/Modal';
import { renderPixelDataToImage } from '../utils/pixelRenderer';
import './styles/Upload.css';

export default function UploadToQueuePage() {
  const { designId } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [design, setDesign] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    start_time: '',
    end_time: '',
    duration: 30,
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

  // Helper: convert ISO to local input value
  const toLocalInput = iso => {
    const d = new Date(iso);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0,16);
  };

  // Load design & existing schedule
  useEffect(() => {
    axios.get(`/design/${designId}`)
      .then(res => setDesign(res.data))
      .catch(console.error);

    axios.get('/rotation/scheduled')
      .then(res => {
        const found = res.data.items.find(s => s.design_id === Number(designId));
        if (found) {
          setExistingScheduleId(found.schedule_id);
          setScheduleData({
            start_time: toLocalInput(found.start_time),
            end_time:   found.end_time ? toLocalInput(found.end_time) : '',
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
      onConfirm: () => { setModalState(m => ({ ...m, isOpen: false })); cb(); },
      onCancel: () => setModalState(m => ({ ...m, isOpen: false }))
    });
  };

  const handleSubmit = async evt => {
    evt.preventDefault();
    const { start_time, end_time, duration, override_current } = scheduleData;

    // 1) No schedule => add to queue
    if (!start_time) {
      try {
        await axios.post('/rotation/add', { design_id: Number(designId) });
        return showAlert('Added to rotation queue!', () => navigate(-1));
      } catch (err) {
        console.error(err);
        return showAlert(err.response?.data?.error || 'Error adding to rotation queue.');
      }
    }

    // 2) Scheduled
    const now = new Date();
    const start = new Date(start_time);
    let end = end_time ? new Date(end_time) : null;

    // Validate future times
    if (start < now) {
      return showAlert('Start time must be in the future.');
    }
    if (end_time && end < now) {
      return showAlert('End time must be in the future.');
    }

    // Default end = +1 day if none
    if (!end) {
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    }

    // Validate order
    if (end <= start) {
      return showAlert('End time must be after start time.');
    }

    // Validate full display
    if ((end - start) < duration * 1000) {
      return showAlert(`The time window must cover at least ${duration} seconds.`);
    }

    const payload = {
      design_id:        Number(designId),
      start_time:       start.toISOString(),
      end_time:         end.toISOString(),
      duration:         Number(duration) || 30,
      override_current: !!override_current
    };

    try {
      if (existingScheduleId) {
        await axios.delete(`/rotation/scheduled/${existingScheduleId}`);
      }
      await axios.post('/rotation/schedule', payload);
      const msg = existingScheduleId
        ? 'Schedule successfully updated!'
        : 'Scheduled successfully!';
      showAlert(msg, () => navigate(-1));
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.error || 'Error scheduling design.');
    }
  };

  return (
    <div className="uploadpage" style={{ overflow: 'hidden' }}>
      <div className="upload-wrapper">
        <h1 className="upload-h1">Queue Upload</h1>

        <div className="upload-menu-wrapper">
          {/* Form Column */}
          <div className="upload-column">
            <form onSubmit={handleSubmit}>
              <label className="block my-2 upload-text">
                Start Time:
                <input
                  type="datetime-local"
                  className="mt-1 block"
                  value={scheduleData.start_time}
                  onChange={e => setScheduleData(s => ({ ...s, start_time: e.target.value }))}
                />
              </label>

              {hasRole('admin') && (
                <label className="block my-2 upload-text">
                  Duration (sec):
                  <input
                    type="number" min="1"
                    className="mt-1 block"
                    value={scheduleData.duration}
                    onChange={e => setScheduleData(s => ({ ...s, duration: e.target.value }))}
                  />
                </label>
              )}

              {hasRole('admin') && (
                <label className="block my-2 upload-text">
                  End Time (optional):
                  <input
                    type="datetime-local"
                    className="mt-1 block"
                    value={scheduleData.end_time}
                    onChange={e => setScheduleData(s => ({ ...s, end_time: e.target.value }))}
                  />
                </label>
              )}

              {hasRole('admin') && (
                <label className="inline-flex items-center my-2 upload-text">
                  <input
                    type="checkbox"
                    checked={scheduleData.override_current}
                    onChange={e => setScheduleData(s => ({ ...s, override_current: e.target.checked }))}
                  />
                  <span className="ml-2">Override Current</span>
                </label>
              )}

              <button type="submit" className="upload-button queue-button mt-4">
                {!scheduleData.start_time
                  ? 'Add to Rotation'
                  : existingScheduleId
                    ? 'Update Schedule'
                    : 'Schedule'}
              </button>
            </form>
          </div>

          {/* Preview Column */}
          <div className="preview-column">
            {design ? (
              <img
                src={renderPixelDataToImage(
                  typeof design.pixel_data === 'string' ? JSON.parse(design.pixel_data) : design.pixel_data,
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
