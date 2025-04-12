import "../components/styles/Menu.css";
import "./styles/Upload.css";
import { useAuth } from '../auth/authContext.js';
import { useState, useRef, useEffect } from "react";
import axios from '../api/axios';

import Modal from "../components/Modal";

function UploadPage() {
    const fileInputRef = useRef(null);

    // Existing file upload form data
    const [formData, setFormData] = useState({
        user_id: '',
        title: '',
        image: null,
    });

    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null, // 'alert' or 'confirm'
        message: '',
        onConfirm: () => {},
        onCancel: () => {}
    });

    // New scheduling state: only start and end date/time
    const [scheduleData, setScheduleData] = useState({
        start_time: '',
        end_time: ''
    });

    // To capture the design_id returned after upload
    const [newDesignId, setNewDesignId] = useState(null);

    // New state variable for showing a success (or error) message from queue insertion
    const [queueMessage, setQueueMessage] = useState('');

    const { currentUser } = useAuth();
    const { upload } = useAuth();
    const userid = currentUser?.user_id;
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (e) => {
        const file = e.target?.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(objectUrl);
            setFormData((prevData) => ({
                ...prevData,
                image: file,
                title: file.name,
            }));
        }
    };

    const showAlert = (message, callback = () => {}) => {
        setModalState({
          isOpen: true,
          type: 'alert',
          message,
          onConfirm: () => {
            setModalState(prev => ({...prev, isOpen: false}));
            callback();
          },
          onCancel: () => setModalState(prev => ({...prev, isOpen: false}))
        });
    };

   const showConfirm = (message, onConfirm, onCancel = () => {}) => {
     setModalState({
       isOpen: true,
       type: 'confirm',
       message: message.includes(formData.image.name) ? message : `${message} "${formData.image.name}"`,
       onConfirm: () => {
         setModalState(prev => ({...prev, isOpen: false}));
         onConfirm();
       },
       onCancel: () => {
         setModalState(prev => ({...prev, isOpen: false}));
         onCancel();
       }
     });
   };

    const handleImageDelete = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset the file input value
        }
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setFormData((prevData) => ({
            ...prevData,
            image: null,
        }));
    };

    // Upload the image to /design endpoint
    const handleSubmit = async (e) => {
        const form = new FormData();
        form.append('user_id', userid);
        if (formData.image) {
            form.append('title', formData.title);
            form.append('image', formData.image);
        }
        try {
            const response = await upload(form);
            if (response.status === 201 && response.data.design_id) {
                showAlert('Image saved successfully!');
                setNewDesignId(response.data.design_id);
            } else {
                showAlert('Image save failed.');
            }
        } catch (error) {
            console.error('Error during save:', error);
            showAlert('An error occurred during save.');
        }
    };

    // Add the uploaded design to the queue with scheduling data
    const handleAddToQueue = async () => {
        if (!newDesignId) {
            showAlert("Please upload an image first.");
            return;
        }

        let finalStart, finalEnd;
        // If both schedule dates are provided, validate and use them.
        if (scheduleData.start_time && scheduleData.end_time) {
            const now = new Date();
            const start = new Date(scheduleData.start_time);
            const end = new Date(scheduleData.end_time);
            if (start < now) {
                showAlert("Error: Scheduled start time must be in the future.");
                return;
            }
            if (start >= end) {
                showAlert("Error: Start time must be before end time.");
                return;
            }
            finalStart = scheduleData.start_time;
            finalEnd = scheduleData.end_time;
        } else {
            // Otherwise, compute the next available slot.
            const now = new Date();
            const nextAvailableStart = new Date(now.getTime() + 60 * 1000); // 1 minute from now
            const defaultDurationSeconds = 60; // default duration (60 seconds)
            const nextAvailableEnd = new Date(nextAvailableStart.getTime() + defaultDurationSeconds * 1000);
            finalStart = nextAvailableStart.toISOString().substring(0, 19);
            finalEnd = nextAvailableEnd.toISOString().substring(0, 19);
        }

        const queueData = {
            design_id: newDesignId,
            start_time: finalStart,
            end_time: finalEnd,
            display_duration: 60,  // default duration for scheduled items
            scheduled: 1,
            scheduled_at: new Date().toISOString()
        };

        try {
            const response = await axios.post('/queue_item', queueData);
            if (response.data.message) {
                setQueueMessage(response.data.message);
            } else {
                showAlert("Image successfully added to queue.");
            }
        } catch (error) {
            showAlert("Error adding image to queue.");
        }
    };

    return (
        <div className="uploadpage">
            <div className="upload-wrapper">
                <h1 className="upload-h1">Save an Image</h1>
                <div className="upload-menu-wrapper">
                    <div className="upload-column">
                        <h2 className="upload-text text-2xl">Select an Image File to Save:</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            showConfirm("Save this image?", () => handleSubmit());
                        }}>
                            <div className="upload-menu my-14">
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="image"
                                        name="image"
                                        ref={fileInputRef}
                                        style={{display: "none"}}
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        type="button"
                                        className="upload-button choose-button"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        Choose File
                                    </button>
                                    {previewUrl && (
                                        <div>
                                            <div className="choose-row">
                                                <button
                                                    type="button"
                                                    className="upload-button delete-button"
                                                    onClick={handleImageDelete}
                                                >
                                                    Delete
                                                </button>
                                                <button type="submit" className="upload-button submit-button">
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Scheduling Section: Only Start and End Date/Time */}
                            {previewUrl && (
                                <div className="scheduling-section">
                                    <h3 className="upload-text">Schedule</h3>
                                    <div>
                                        <label>Start Time:</label>
                                        <input
                                            type="datetime-local"
                                            value={scheduleData.start_time}
                                            onChange={(e) =>
                                                setScheduleData({...scheduleData, start_time: e.target.value})
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label>End Time:</label>
                                        <input
                                            type="datetime-local"
                                            value={scheduleData.end_time}
                                            onChange={(e) =>
                                                setScheduleData({...scheduleData, end_time: e.target.value})
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </form>
                        {previewUrl && (
                            <button
                                type="button"
                                className="upload-button queue-button"
                                onClick={handleAddToQueue}
                            >
                                Add to Queue
                            </button>
                        )}
                        {/* Display the queue message if present */}
                        {queueMessage && (
                            <div className="queue-message">
                                {queueMessage}
                            </div>
                        )}
                    </div>
                    <div className="preview-column">
                        <h3 className="upload-text mb-4">Preview:</h3>
                        <p className="upload-p mb-4">
                            {formData.image ? `Selected file: ${formData.image.name}` : "No file selected"}
                        </p>
                        <img src={previewUrl} alt="Preview" />
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

export default UploadPage;
