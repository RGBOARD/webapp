import "../components/styles/Menu.css";
import "./styles/Upload.css";
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/authContext.js';
import axios from '../api/axios';
import Modal from '../components/Modal';
import { renderPixelDataToImage } from '../utils/pixelRenderer';
import { formatDateTime, formatDateForPicker } from '../utils/dateUtils';

export default function UploadToQueuePage() {
  const { designId } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [design, setDesign] = useState(null);
  const [scheduledTimes, setScheduledTimes] = useState([]);
  const [existingScheduleId, setExistingScheduleId] = useState(null);

  const [scheduleData, setScheduleData] = useState({
    start_time: '',
    end_time: '',
    duration: 30,
    override_current: false
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Convert ISO string to local datetime-local input value
  const toLocalInput = iso => {
    const d = new Date(iso);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0,16);
  };

  // Fetch design and all scheduled items for conflict checking
  useEffect(() => {
  axios.get(`/design/${designId}`)
    .then(res => setDesign(res.data))
    .catch(console.error);

  axios.get('/rotation/scheduled')
    .then(res => {
      // sort by start_time ascending
      const items = (res.data.items || [])
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      setScheduledTimes(items);

      const found = items.find(s => s.design_id === Number(designId));
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


  // Scheduling helpers from Code 1
  const checkTimeConflict = (startTimeStr, scheduledItems, newItemDuration) => {
    const start = new Date(startTimeStr);
    start.setSeconds(0, 0);
    const duration = newItemDuration || 60;
    const newEnd = new Date(start.getTime() + duration * 1000);

    return scheduledItems.some(item => {
      const itemStart = new Date(item.start_time);
      itemStart.setSeconds(0, 0);
      if (start.getTime() === itemStart.getTime()) return true;

      const itemDur = parseInt(item.duration) || 60;
      const itemEndDisp = new Date(itemStart.getTime() + itemDur * 1000);
      if (start >= itemStart && start < itemEndDisp) return true;
      if (itemStart >= start && itemStart < newEnd) return true;

      if (item.end_time) {
        const itemEndSched = new Date(item.end_time);
        itemEndSched.setSeconds(0, 0);
        if (start >= itemStart && start <= itemEndSched) return true;
        if (newEnd > itemStart && newEnd <= itemEndSched) return true;
      }

      return false;
    });
  };

  const findNextAvailableClientSide = (startTimeStr, scheduledItems, newItemDuration) => {
    const startTime = new Date(startTimeStr);
    startTime.setSeconds(0, 0);
    if (!checkTimeConflict(startTime.toISOString(), scheduledItems, newItemDuration)) return startTime;

    const INCREMENT_MINUTES = 5;
    let currentTime = new Date(startTime);
    for (let i = 0; i < 24; i++) {
      currentTime = new Date(currentTime.getTime() + INCREMENT_MINUTES * 60 * 1000);
      if (!checkTimeConflict(currentTime.toISOString(), scheduledItems, newItemDuration)) {
        return currentTime;
      }
    }

    const nextDay = new Date(startTime);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  };

  const showAlert = (message, cb = () => {}) => {
    setModalState({
      isOpen: true,
      type: 'alert',
      message,
      onConfirm: () => { setModalState(m => ({ ...m, isOpen: false })); cb(); },
      onCancel: () => setModalState(m => ({ ...m, isOpen: false }))
    });
  };

  const showConfirm = (message, onConfirm, onCancel = () => {}) => {
    setModalState({
      isOpen: true,
      type: 'confirm',
      message,
      onConfirm: () => { setModalState(m => ({ ...m, isOpen: false })); onConfirm(); },
      onCancel: () => { setModalState(m => ({ ...m, isOpen: false })); onCancel(); }
    });
  };

  const handleSubmit = async evt => {
    evt.preventDefault();
    const { start_time, end_time, duration, override_current } = scheduleData;
    const now = new Date();


    if (existingScheduleId && start_time) {
      const scheduledStart = new Date(start_time);
      if (scheduledStart <= now) {
        showAlert(
            'This schedule has already started and cannot be modified.',
            () => navigate('/view-saved-images')
        );
        return;
      }
    }
    // Immediate add if no start_time
    if (!start_time) {
      try {
        await axios.post('/rotation/add', { design_id: Number(designId) });
        return showAlert('Added to rotation queue!', () => navigate(-1));
      } catch (err) {
        console.error(err);
        return showAlert(err.response?.data?.error || 'Error adding to rotation queue.');
      }
    }

    // Conflict check & suggestion
    if (checkTimeConflict(start_time, scheduledTimes, duration)) {
      const suggested = findNextAvailableClientSide(start_time, scheduledTimes, duration);
      const sugLocal = toLocalInput(suggested.toISOString());
      return showConfirm(
        `This time slot is already taken. Would you like to schedule for ${sugLocal.replace('T',' ')} instead?`,
        () => setScheduleData(s => ({ ...s, start_time: formatDateForPicker(suggested) }))
      );
    }

    // Validate times
    const start = new Date(start_time);
    if (start < now) return showAlert('Start time must be in the future.');
    let end = end_time ? new Date(end_time) : null;
    if (end_time && end < now) return showAlert('End time must be in the future.');
    if (!end) {
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    }
    if (end <= start) return showAlert('End time must be after start time.');
    if ((end - start) < duration * 1000) return showAlert(`Window must cover at least ${duration} seconds.`);

    // Build payload
    const isAdmin = hasRole('admin');
    const payload = { design_id: Number(designId), start_time, override_current: isAdmin ? override_current : false };

    if (isAdmin) {
      payload.duration = parseInt(duration) || 60;
      if (end_time) {
        const endDate = new Date(end_time);
        if (start >= endDate) return showAlert('Error: Start time must be before end time.');
        payload.end_time = end_time;
      }
    } else {
      payload.duration = 30;
      const autoEnd = new Date(start);
      autoEnd.setDate(autoEnd.getDate() + 1);
      payload.end_time = autoEnd.toISOString().slice(0,16);
    }

    try {
      if (existingScheduleId) {
        await axios.delete(`/rotation/scheduled/${existingScheduleId}`);
      }
      await axios.post('/rotation/schedule', payload);
      const msg = existingScheduleId ? 'Schedule successfully updated!' : 'Scheduled successfully!';
      showAlert(msg, () => navigate(-1));
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409 && err.response.data?.suggested_time) {
        const sug = toLocalInput(err.response.data.suggested_time);
        return showConfirm(
          `Another user just scheduled that slot. Try ${sug.replace('T',' ')} instead?`,
          () => setScheduleData(s => ({ ...s, start_time: sug }))
        );
      }
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
