import ScheduleSection from "../components/ScheduleSection";
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from '../api/axios';
import Modal from '../components/Modal';

export default function UploadToQueuePage() {
  const { designId } = useParams();
  const navigate = useNavigate();

  // Design details
  const [design, setDesign] = useState(null);
  // Scheduling state
  const [scheduleData, setScheduleData] = useState({ start_time: '', end_time: '' });
  const [existingItemId, setExistingItemId] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: () => {}, onCancel: () => {} });
  const [queueMessage, setQueueMessage] = useState('');

  // Fetch design and any existing schedule
  useEffect(() => {
    // Design details
    axios.get(`/designs/${designId}`)
      .then(res => setDesign(res.data))
      .catch(console.error);

    // Look for an existing scheduled queue item
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
            end_time: toInput(existing.end_time)
          });
        }
      })
      .catch(console.error);
  }, [designId]);

  const showAlert = (message, callback = () => {}) => {
    setModalState({
      isOpen: true,
      type: 'alert',
      message,
      onConfirm: () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        callback();
      },
      onCancel: () => setModalState(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleAddToQueue = async () => {
    const { start_time, end_time } = scheduleData;
    let finalStart, finalEnd;

    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      if (end <= start) {
        showAlert('Error: End time must be after start time.');
        return;
      }
      finalStart = start_time;
      finalEnd = end_time;
    } else {
      // Default: next minute to one day later
      const now = new Date();
      const nextStart = new Date(now.getTime() + 60 * 1000);
      const nextEnd = new Date(nextStart.getTime() + 24 * 60 * 60 * 1000);
      finalStart = nextStart.toISOString().substring(0, 19);
      finalEnd = nextEnd.toISOString().substring(0, 19);
    }

    // Always default to 60s display duration
    const queueData = {
      design_id: Number(designId),
      start_time: finalStart,
      end_time: finalEnd,
      display_duration: 60,
      scheduled: 1,
      scheduled_at: new Date().toISOString()
    };

    try {
      if (existingItemId) {
        // Update existing schedule
        await axios.put(`/queue_item/${existingItemId}`, queueData);
      } else {
        // Create new schedule
        await axios.post('/queue_item', queueData);
      }
      setQueueMessage('Scheduled successfully.');
      navigate('/view');
    } catch (err) {
      console.error(err);
      showAlert('Error adding image to queue.');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Schedule Design #{designId}</h1>
      {design && <p className="mb-4"><strong>Title:</strong> {design.title}</p>}
      <ScheduleSection
        scheduleData={scheduleData}
        setScheduleData={setScheduleData}
        onSubmit={handleAddToQueue}
        submitLabel="Schedule"
        error={queueMessage}
      />
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