import "../components/styles/Menu.css";
import "./styles/Upload.css";
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  
  // Use a ref to track if a redirect is pending to prevent modal conflicts
  const redirectPending = useRef(false);

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
  
  // Helper functions for modals with improved prioritization
  const showAlert = (message, cb = () => { }) => {
    // Don't show new modals if redirect is pending
    if (redirectPending.current) return;
    
    setModalState({
      isOpen: true,
      type: 'alert',
      message,
      onConfirm: () => { 
        setModalState(m => ({ ...m, isOpen: false })); 
        cb(); 
      },
      onCancel: () => setModalState(m => ({ ...m, isOpen: false }))
    });
  };

  const showConfirm = (message, onConfirm, onCancel = () => { }) => {
    // Don't show new modals if redirect is pending
    if (redirectPending.current) return;
    
    setModalState({
      isOpen: true,
      type: 'confirm',
      message,
      onConfirm: () => { 
        setModalState(m => ({ ...m, isOpen: false })); 
        onConfirm(); 
      },
      onCancel: () => { 
        setModalState(m => ({ ...m, isOpen: false })); 
        onCancel(); 
      }
    });
  };

  // Unified function to handle schedule started issues
  const handleScheduleStarted = (message = 'This schedule has already started and cannot be modified.') => {
    // Set the redirect flag to prevent other modals
    redirectPending.current = true;
    
    // Close any open modal first
    setModalState(prev => ({ ...prev, isOpen: false }));
    
    // Show the alert after modal is closed
    setTimeout(() => {
      setModalState({
        isOpen: true,
        type: 'alert',
        message,
        onConfirm: () => { 
          setModalState(m => ({ ...m, isOpen: false })); 
          navigate('/view-saved-images');
        },
        onCancel: () => setModalState(m => ({ ...m, isOpen: false }))
      });
    }, 50);
  };
  
  // 1) Initial load: fetch design & schedules, detect if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get design data
        const designRes = await axios.get(`/design/${designId}`);
        setDesign(designRes.data);
        
        // Get scheduled items
        const scheduleRes = await axios.get('/rotation/scheduled');
        const items = (scheduleRes.data.items || [])
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        
        setScheduledTimes(items);
        
        // Check if we're editing an existing schedule
        const found = items.find(s => s.design_id === Number(designId));
        if (found) {
          const start = new Date(formatISODateTime(found.start_time));
          const now = new Date();
          
          // If already started, show alert and redirect
          if (start <= now) {
            handleScheduleStarted();
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
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        showAlert('Error loading data. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [designId]);

  // 2) Periodic check for schedule status changes (only when editing)
  useEffect(() => {
    // Only run for existing schedules in edit mode and not when redirect is pending
    if (!existingScheduleId || !isEditing || redirectPending.current) return;
    
    const checkScheduleExists = async () => {
      try {
        // Skip checks if redirect already pending
        if (redirectPending.current) return;
        
        await axios.get(`/rotation/scheduled/${existingScheduleId}`);
        // Schedule still exists, do nothing
      } catch (err) {
        if (err.response?.status === 404) {
          handleScheduleStarted('This schedule cannot be edited as it has already been processed and moved to the rotation queue.');
        }
      }
    };
    
    // Check immediately
    checkScheduleExists();
    
    // Then check every few seconds
    const intervalId = setInterval(checkScheduleExists, 5000);
    
    return () => clearInterval(intervalId);
  }, [existingScheduleId, isEditing]);

  // 3) Check if schedule time has passed while modal is open
  useEffect(() => {
    // Only run this check when a modal is open AND we're in edit mode
    if (!modalState.isOpen || !isEditing || !scheduleData.start_time || redirectPending.current) return;
    
    const intervalId = setInterval(() => {
      // Skip if redirect is pending
      if (redirectPending.current) {
        clearInterval(intervalId);
        return;
      }
      
      const startMs = new Date(scheduleData.start_time).getTime();
      const nowMs = Date.now();
      
      // If schedule has started, handle redirect
      if (startMs <= nowMs) {
        clearInterval(intervalId);
        handleScheduleStarted();
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [modalState.isOpen, isEditing, scheduleData.start_time]);

  const handleSubmit = async evt => {
    evt.preventDefault();
    
    // If redirect is pending, don't process form
    if (redirectPending.current) return;
    
    const { start_time, end_time, duration, override_current } = scheduleData;
    const now = new Date();

    // Check if editing schedule still exists
    if (existingScheduleId) {
      try {
          await axios.get(`/rotation/scheduled/${existingScheduleId}`);
      } catch (err) {
          if (err.response?.status === 404) {
              handleScheduleStarted('This schedule cannot be edited as it has already been processed and moved to the rotation queue.');
              return;
          }
          console.error(err);
          return showAlert('Error checking schedule status. Please try again.');
      }
    }

    // Disallow clearing the schedule when editing
    if (existingScheduleId && !start_time) {
      return showAlert(
        'This schedule cannot be removed once set.',
        () => navigate('/view-saved-images')
      );
    }

    // Block editing if start time is now in the past
    if (existingScheduleId && start_time) {
      const scheduledStart = new Date(start_time);
      if (scheduledStart <= now) {
        handleScheduleStarted();
        return;
      }
    }

    // Handle direct "Add to rotation" case
    // if (!start_time && !existingScheduleId) {
    //   try {
    //     await axios.post('/rotation/add', { design_id: Number(designId) });
    //     return showAlert('Added to rotation queue!', () => navigate(-1));
    //   } catch (err) {
    //     console.error(err);
    //     return showAlert(err.response?.data?.error || 'Error adding to rotation queue.');
    //   }
    // }

    // Standard time validations
    let start = start_time ? new Date(start_time) : new Date();
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

    // Build payload
    const isAdmin = hasRole('admin');

    // Convert start_time to UTC
    let startLocal = start_time ? new Date(start_time) : new Date();
    let startTimeUTC = startLocal.toISOString().slice(0, 16);

    const payload = {
      design_id: Number(designId),
      start_time: startTimeUTC,
      override_current: isAdmin ? override_current : false
    };

    if (isAdmin) {
      payload.duration = parseInt(duration) || 60;

      if (end_time) {
        // User provided an end time
        const endLocal = new Date(end_time);
        if (startLocal >= endLocal) {
          return showAlert('Error: Start time must be before end time.');
        }
        payload.end_time = endLocal.toISOString().slice(0, 16);
      } else {
        // Auto-generate end time (24 hours after start) for admin
        const autoEnd = new Date(startLocal);
        autoEnd.setDate(autoEnd.getDate() + 1);
        payload.end_time = autoEnd.toISOString().slice(0, 16);
      }
    } else {
      // For non-admin users
      payload.duration = 30;
      const autoEnd = new Date(startLocal);
      autoEnd.setDate(autoEnd.getDate() + 1);
      payload.end_time = autoEnd.toISOString().slice(0, 16);
    }

    try {
      if (!start_time && !existingScheduleId) {
        await axios.post('/rotation/add', payload);
      }
      else if (existingScheduleId) {
        // Use PUT for update instead of delete + post to avoid the race condition
        await axios.put(`/rotation/scheduled/${existingScheduleId}`, payload);
      } else {
        // Only use POST for new schedules
        await axios.post('/rotation/schedule', payload);
      }
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
            {isLoading ? (
              <p className="upload-text">Loading...</p>
            ) : (
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

                <button 
                  type="submit" 
                  className="upload-button queue-button mt-4"
                  disabled={redirectPending.current}
                >
                  {!scheduleData.start_time && !existingScheduleId
                    ? 'Add to Rotation'
                    : existingScheduleId
                      ? 'Update Schedule'
                      : 'Schedule'}
                </button>
              </form>
            )}
          </div>

          {/* Preview Column */}
          <div className="preview-column">
            {isLoading ? (
              <p className="upload-text">Loading preview…</p>
            ) : design ? (
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
              <p className="upload-text">No preview available</p>
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