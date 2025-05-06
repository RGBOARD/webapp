import "../components/styles/Menu.css";
import "./styles/Upload.css";
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/authContext.js';
import axios from '../api/axios';
import Modal from '../components/Modal';
import { renderPixelDataToImage } from '../utils/pixelRenderer';
import { formatISODateTime, formatDateForPicker } from '../utils/dateUtils';

export default function UploadToQueuePage() {
  const { designId } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [design, setDesign] = useState(null);
  const [scheduledTimes, setScheduledTimes] = useState([]);
  const [existingScheduleId, setExistingScheduleId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
    onConfirm: () => { },
    onCancel: () => { }
  });
  
  const [forceCloseAndRedirect, setForceCloseAndRedirect] = useState(false);
  
  // 1) Initial load: fetch design & schedules, detect if editing
  useEffect(() => {
    axios.get(`/design/${designId}`)
      .then(res => setDesign(res.data))
      .catch(console.error);

    axios.get('/rotation/scheduled')
      .then(res => {
        const items = (res.data.items || [])
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

        const found = items.find(s => s.design_id === Number(designId));
        if (found) {
          const start = new Date(found.start_time);
          const now = new Date();
          // If already started, kick out immediately:
          if (start <= now) {
            showAlert(
              'This schedule has already started and cannot be modified.',
              () => navigate('/view-saved-images')
            );
            return;
          }
          // Otherwise load it for editing
          setExistingScheduleId(found.schedule_id);

          const foundStartTime = new Date(
            found.start_time.includes('Z') ? found.start_time :
            found.start_time.includes('T') ? found.start_time + 'Z' :
            found.start_time.replace(' ', 'T') + 'Z'
          );

          const foundEndTime = found.end_time ? new Date(
            found.end_time.includes('Z') ? found.end_time :
            found.end_time.includes('T') ? found.end_time + 'Z' :
            found.end_time.replace(' ', 'T') + 'Z'
          ) : '';

          setScheduleData({
            start_time: formatDateForPicker(foundStartTime),
            end_time: found.end_time ? formatDateForPicker(foundEndTime) : '',
            duration: found.duration,
            override_current: found.override_current
          });
          setIsEditing(true);
        }

        setScheduledTimes(items);
      })
      .catch(console.error);
  }, [designId]);

  // 2) As soon as the clock hits your original start_time, auto-block
  useEffect(() => {
    // Only run for existing schedules in edit mode
    if (!existingScheduleId || !isEditing) return;
    
    const checkScheduleExists = async () => {
      try {
        await axios.get(`/rotation/scheduled/${existingScheduleId}`);
        // Schedule still exists, do nothing
      } catch (err) {
        if (err.response?.status === 404) {
          // Schedule no longer exists - force close any open modal
          setModalState(prev => ({ ...prev, isOpen: false }));
          
          // Show the alert after a short delay
          setTimeout(() => {
            showAlert(
              'This schedule cannot be edited as it has already been processed and moved to the rotation queue.',
              () => navigate('/view-saved-images')
            );
          }, 50);
        }
      }
    };
    
    // Check immediately
    checkScheduleExists();
    
    // Then check every few seconds
    const intervalId = setInterval(checkScheduleExists, 5000); // Check every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [existingScheduleId, isEditing]);

  useEffect(() => {
    if (forceCloseAndRedirect) {
      // First close any open modal
      setModalState(prev => ({ ...prev, isOpen: false }));
      
      // Then wait a tiny bit for the modal to close
      setTimeout(() => {
        showAlert(
          'This schedule has already started and cannot be modified.',
          () => navigate('/view-saved-images')
        );
        // Reset the flag
        setForceCloseAndRedirect(false);
      }, 50);
    }
  }, [forceCloseAndRedirect]);

  useEffect(() => {
    // Only run this check when a modal is open AND we're in edit mode
    if (!modalState.isOpen || !isEditing || !scheduleData.start_time) return;
    
    // This interval will check every second if the schedule has started
    // while a modal is open
    const intervalId = setInterval(() => {
      const startMs = new Date(scheduleData.start_time).getTime();
      const nowMs = Date.now();
      
      // If schedule has started, force close the modal
      if (startMs <= nowMs) {
        // Clear the interval first
        clearInterval(intervalId);
        
        // Set the flag to force close and redirect
        setForceCloseAndRedirect(true);
      }
    }, 1000); // Check every second
    
    // Clean up on unmount or when dependencies change
    return () => clearInterval(intervalId);
  }, [modalState.isOpen, isEditing, scheduleData.start_time]);

  const showAlert = (message, cb = () => { }) => {
    setModalState({
      isOpen: true,
      type: 'alert',
      message,
      onConfirm: () => { setModalState(m => ({ ...m, isOpen: false })); cb(); },
      onCancel: () => setModalState(m => ({ ...m, isOpen: false }))
    });
  };

  const showConfirm = (message, onConfirm, onCancel = () => { }) => {
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

    if (existingScheduleId) {
      try {
          await axios.get(`/rotation/scheduled/${existingScheduleId}`);
      } catch (err) {
          if (err.response?.status === 404) {
              return showAlert(
                  'This schedule cannot be edited as it has already been processed and moved to the rotation queue.',
                  () => navigate('/view-saved-images')
              );
          }
          console.error(err);
          return showAlert('Error checking schedule status. Please try again.');
      }
  }

    // 3) Disallow clearing the schedule when editing
    if (existingScheduleId && !start_time) {
      return showAlert(
        'This schedule cannot be removed once set.',
        () => navigate('/view-saved-images')
      );
    }

    // 4) Block editing if start time is now in the past
    if (existingScheduleId && start_time) {
      const scheduledStart = new Date(start_time);
      if (scheduledStart <= now) {
        return showAlert(
          'This schedule has already started and cannot be modified.',
          () => navigate('/view-saved-images')
        );
      }
    }

    // 5) Only “Add to rotation” when NOT editing
    if (!start_time && !existingScheduleId) {
      try {
        await axios.post('/rotation/add', { design_id: Number(designId) });
        return showAlert('Added to rotation queue!', () => navigate(-1));
      } catch (err) {
        console.error(err);
        return showAlert(err.response?.data?.error || 'Error adding to rotation queue.');
      }
    }

    // 7) Standard time validations (unchanged)
    const start = new Date(start_time);
    if (start < now) return showAlert('Start time must be in the future.');
    let end = end_time ? new Date(end_time) : null;
    if (end_time && end < now) return showAlert('End time must be in the future.');
    if (!end) {
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    }
    if (end <= start) return showAlert('End time must be after start time.');
    if ((end - start) < duration * 1000) {
      return showAlert(`Window must cover at least ${duration} seconds.`);
    }

    // 8) Build payload & call API (unchanged)
    const isAdmin = hasRole('admin');

    // Convert start_time to UTC
    const startLocal = new Date(start_time);
    const startTimeUTC = startLocal.toISOString().slice(0, 16);

    // Convert end_time to UTC if it exists
    let endTimeUTC = null;
    if (end_time) {
      const endLocal = new Date(end_time);
      endTimeUTC = endLocal.toISOString().slice(0, 16);
    }

    const payload = {
      design_id: Number(designId),
      start_time: startTimeUTC, // Now sending in UTC
      override_current: isAdmin ? override_current : false
    };
    if (isAdmin) {
      payload.duration = parseInt(duration) || 60;
      if (end_time) {
        // User provided an end time
        if (startLocal >= new Date(end_time)) {
          return showAlert('Error: Start time must be before end time.');
        }
        payload.end_time = endTimeUTC; // Now sending in UTC
      } else {
        // Auto-generate end time (24 hours after start) for admin too
        const autoEnd = new Date(startLocal);
        autoEnd.setDate(autoEnd.getDate() + 1);
        payload.end_time = autoEnd.toISOString().slice(0, 16);
      }
    } else {
      payload.duration = 30;
      const autoEnd = new Date(startLocal);
      autoEnd.setDate(autoEnd.getDate() + 1);
      payload.end_time = autoEnd.toISOString().slice(0, 16); // Already UTC
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
        const serverSuggestedTime = err.response.data?.suggested_time;

        const suggestedDate = new Date(
          serverSuggestedTime.includes('Z') ? serverSuggestedTime :
            serverSuggestedTime.includes('T') ? serverSuggestedTime + 'Z' :
              serverSuggestedTime.replace(' ', 'T') + 'Z'
        );

        // Use your existing formatDateForPicker function
        const pickerFormat = formatDateForPicker(suggestedDate);

        return showConfirm(
          `Another user just scheduled that slot. Try ${formatISODateTime(serverSuggestedTime)} instead?`,
          () => setScheduleData(s => ({ ...s, start_time: pickerFormat }))
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
                {!scheduleData.start_time && !existingScheduleId
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
                  typeof design.pixel_data === 'string'
                    ? JSON.parse(design.pixel_data)
                    : design.pixel_data,
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
