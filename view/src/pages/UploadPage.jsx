import "../components/styles/Menu.css";
import "./styles/Upload.css";
import { useAuth } from '../auth/authContext.js';
import { useState, useRef, useEffect } from "react";
import axios from '../api/axios';
import { Stage, Layer, Rect } from "react-konva";
import { convertImageToPixels } from "../utils/imageConverter";
import { formatDateTime, formatDateForPicker } from "../utils/dateUtils"
import Modal from "../components/Modal";

function UploadPage() {
    const fileInputRef = useRef(null);
    const stageRef = useRef(null);

    // Pixel art canvas settings - match CreatePage
    const gridSize = 8;
    const canvasSize = { width: 512, height: 512 };

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
        onConfirm: () => { },
        onCancel: () => { }
    });

    // Schedule data state
    const [scheduleData, setScheduleData] = useState({
        duration: 60,
        start_time: '',
        end_time: '',
        override_current: false
    });

    // To capture the design_id returned after upload
    const [newDesignId, setNewDesignId] = useState(null);
    const [queueMessage, setQueueMessage] = useState('');

    // New state for pixel preview
    const [pixels, setPixels] = useState({});
    const [isConverting, setIsConverting] = useState(false);
    const [pixelatedPreviewUrl, setPixelatedPreviewUrl] = useState(null);

    const { currentUser, upload } = useAuth();
    const userid = currentUser?.user_id;
    const [previewUrl, setPreviewUrl] = useState(null);

    const { hasRole } = useAuth(); // Access the auth context

    const [isUploading, setIsUploading] = useState(false);
    const [isAddingToQueue, setIsAddingToQueue] = useState(false);
    const [scheduledTimes, setScheduledTimes] = useState([]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            if (pixelatedPreviewUrl) {
                URL.revokeObjectURL(pixelatedPreviewUrl);
            }
        };
    }, [previewUrl, pixelatedPreviewUrl]);

    useEffect(() => {
        const fetchScheduledItems = async () => {
            try {
                // We only need explicitly scheduled future items from the scheduled_items table
                const response = await axios.get('/rotation/scheduled');

                if (response.data && response.data.items) {
                    setScheduledTimes(response.data.items);
                }
            } catch (error) {
                console.error("Error fetching scheduled items:", error);
            }
        };

        fetchScheduledItems();
    }, []);

    const checkTimeConflict = (startTimeStr, scheduledTimes, newItemDuration) => {
        // Create a Date object from the ISO string and zero out seconds/milliseconds
        const start = new Date(startTimeStr);
        start.setSeconds(0, 0);
        
        // Ensure duration is at least 60 seconds
        const duration = newItemDuration || 60;
        
        // Calculate when our new item would finish displaying
        const newItemDisplayEnd = new Date(start.getTime() + (duration * 1000));
        
        return scheduledTimes.some(item => {
          // Create a Date object from the item's start time
          const itemStart = new Date(item.start_time);
          itemStart.setSeconds(0, 0);
          
          // If start times match at minute precision, it's an immediate conflict
          if (start.getTime() === itemStart.getTime()) {
            return true;
          }
          
          // Calculate when this scheduled item ends display
          const itemDuration = parseInt(item.duration) || 60;
          const itemDisplayEnd = new Date(itemStart.getTime() + (itemDuration * 1000));
          
          // Check for overlap between our new item and the existing one
          // Case 1: New item starts during existing item's display window
          if (start >= itemStart && start < itemDisplayEnd) {
            return true;
          }
          
          // Case 2: Existing item starts during new item's display window
          if (itemStart >= start && itemStart < newItemDisplayEnd) {
            return true;
          }
          
          // Handle cases where items have end_time (scheduled expiration)
          if (item.end_time) {
            const itemEnd = new Date(item.end_time);
            itemEnd.setSeconds(0, 0);
            
            // Check if new item starts during the scheduled period
            if (start >= itemStart && start <= itemEnd) {
              return true;
            }
            
            // Check if new item would display beyond its end_time (if specified)
            if (newItemDisplayEnd > itemStart && newItemDisplayEnd <= itemEnd) {
              return true;
            }
          }
          
          return false;
        });
      };

    const handleFileChange = async (e) => {
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

            // Convert image to pixels
            setIsConverting(true);
            try {
                const { pixels, pixelatedDataURL } = await convertImageToPixels(file);
                setPixels(pixels);
                setPixelatedPreviewUrl(pixelatedDataURL);
            } catch (error) {
                console.error("Error converting image:", error);
                showAlert("Error converting image to pixels");
            } finally {
                setIsConverting(false);
            }
        }
    };

    const showAlert = (message, callback = () => { }) => {
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

    const showConfirm = (message, onConfirm, onCancel = () => { }) => {
        setModalState({
            isOpen: true,
            type: 'confirm',
            message: message.includes(formData.image?.name) ? message : `${message} "${formData.image?.name}"`,
            onConfirm: () => {
                setModalState(prev => ({ ...prev, isOpen: false }));
                onConfirm();
            },
            onCancel: () => {
                setModalState(prev => ({ ...prev, isOpen: false }));
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
        if (pixelatedPreviewUrl) {
            URL.revokeObjectURL(pixelatedPreviewUrl);
            setPixelatedPreviewUrl(null);
        }
        setPixels({});
        setFormData((prevData) => ({
            ...prevData,
            image: null,
        }));
    };

    // Upload the image and pixel data to /design endpoint
    const handleSubmit = async () => {
        // Validate data
        if (Object.keys(pixels).length === 0) {
            showAlert('Please draw something on the canvas before saving');
            return;
        }

        if (!formData.title || !formData.title.trim()) {
            showAlert('Please enter a file name');
            return;
        }

        showConfirm(
            'Are you sure you want to save this design?',
            async () => {
                setIsUploading(true); // Set loading state
                try {
                    // Create form data
                    const form = new FormData();
                    form.append('user_id', userid);
                    form.append('title', formData.title);

                    // Convert pixels object to JSON string and send it
                    const pixelDataJSON = JSON.stringify(pixels);
                    form.append('pixel_data', pixelDataJSON);

                    const result = await upload(form);

                    if (result.success) {
                        showAlert('Design saved successfully!');
                        setNewDesignId(result.data.design_id);
                    } else {
                        showAlert(`Design save failed: ${result.error}`);
                    }
                } catch (error) {
                    console.error('Error during save:', error);
                    showAlert(`Error during save: ${error.message || "Unknown error"}`);
                } finally {
                    setIsUploading(false); // Reset loading state
                }
            }
        );
    };

    const findNextAvailableClientSide = (startTimeStr, scheduledTimes, newItemDuration) => {
        // Start with the requested time
        const startTime = new Date(startTimeStr);
        startTime.setSeconds(0, 0);
        
        // Check if the initial time is available first
        if (!checkTimeConflict(startTime.toISOString(), scheduledTimes, newItemDuration)) {
          return startTime;
        }
        
        // If initial time is not available, try increments of 5 minutes
        const INCREMENT_MINUTES = 5;
        let currentTime = new Date(startTime);
        
        // Try up to 24 increments (2 hours) - matches backend logic
        for (let i = 0; i < 24; i++) {
          // Add 5 minutes
          currentTime = new Date(currentTime.getTime() + (INCREMENT_MINUTES * 60 * 1000));
          
          // Check if this time is available
          if (!checkTimeConflict(currentTime.toISOString(), scheduledTimes, newItemDuration)) {
            return currentTime;
          }
        }
        
        // If we couldn't find a slot within 2 hours, try the next day at the same time
        const nextDay = new Date(startTime);
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay;
      };

    
    // Add the uploaded design to the rotation with scheduling data
    const handleAddToQueue = async () => {
        if (!newDesignId) {
            showAlert("Please upload an image first.");
            return;
        }

        const isAdmin = hasRole('admin');
        
        // Process scheduling - now both admins and regular users can schedule
        if (scheduleData.start_time) {
            const now = new Date();
            const start = new Date(scheduleData.start_time);

            if (start < now) {
                showAlert("Error: Scheduled start time must be in the future.");
                return;
            }

            // Prepare schedule payload with appropriate defaults
            const schedulePayload = {
                design_id: newDesignId,
                start_time: scheduleData.start_time,
                override_current: isAdmin ? (scheduleData.override_current || false) : false
            };

            // For admin users, use their custom duration and end_time if provided
            if (isAdmin) {
                schedulePayload.duration = parseInt(scheduleData.duration) || 60; // Default to 60 seconds for admins
                
                // Add and validate end_time if provided by admin
                if (scheduleData.end_time) {
                    const end = new Date(scheduleData.end_time);
                    if (start >= end) {
                        showAlert("Error: Start time must be before end time.");
                        return;
                    }
                    schedulePayload.end_time = scheduleData.end_time;
                }
            } else {
                // For regular users, apply fixed defaults
                schedulePayload.duration = 30; // Fixed 30 seconds for regular users
                
                // Calculate end_time as start_time + 1 day for regular users
                const endDate = new Date(start);
                endDate.setDate(endDate.getDate() + 1);
                schedulePayload.end_time = endDate.toISOString().slice(0, 16);
            }

            // Check for time conflicts (for both admin and regular users)
            if (checkTimeConflict(scheduleData.start_time, scheduledTimes, schedulePayload.duration)) {
                // Find the next available time slot (in 5-minute increments)
                const suggestedTime = findNextAvailableClientSide(
                    scheduleData.start_time,
                    scheduledTimes,
                    schedulePayload.duration
                );

                showConfirm(
                    `This time slot is already taken. Would you like to schedule for ${formatDateTime(suggestedTime).replace('T', ' ')} instead?`,
                    () => {
                        // Update the form with suggested time
                        setScheduleData({
                            ...scheduleData,
                            start_time: formatDateForPicker(suggestedTime)
                        });
                        // Don't submit yet - let user review the new time
                    }
                );
                return;
            }

            setIsAddingToQueue(true);
            try {
                const response = await axios.post('/rotation/schedule', schedulePayload);
                
                showAlert("Image successfully scheduled for rotation.", () => {
                    window.location.reload();
                });
            } catch (error) {
                // Handle 409 conflict response
                if (error.response?.status === 409 && error.response.data?.suggested_time) {
                    const suggestedDate = new Date(error.response.data.suggested_time);
                    const formattedSuggestion = suggestedDate.toISOString().slice(0, 16);
                    
                    showConfirm(
                        `Another user just scheduled for this time. Would you like to schedule for ${formattedSuggestion.replace('T', ' ')} instead?`,
                        () => {
                            setScheduleData({
                                ...scheduleData,
                                start_time: formattedSuggestion
                            });
                            // Let user review the new time before resubmitting
                        }
                    );
                } else {
                    showAlert(error.response?.data?.error || "Error scheduling image for rotation.");
                }
            } finally {
                setIsAddingToQueue(false);
            }
        } else {
            // Standard non-scheduled add to rotation
            setIsAddingToQueue(true);
            try {
                const response = await axios.post('/rotation/add', {
                    design_id: newDesignId
                });

                showAlert("Image successfully added to rotation.", () => {
                    window.location.reload();
                });
            } catch (error) {
                showAlert(error.response?.data?.error || "Error adding image to rotation.");
            } finally {
                setIsAddingToQueue(false);
            }
        }
    };

    // Render pixelated preview using Konva
    const renderPixelPreview = () => {
        return (
            <div className="pixelated-preview">
                <h3 className="upload-text mb-4">64x64 Pixel Preview:</h3>
                <Stage
                    width={canvasSize.width}
                    height={canvasSize.height}
                    ref={stageRef}
                >
                    <Layer>
                        <Rect
                            width={canvasSize.width}
                            height={canvasSize.height}
                            fill="black"
                        />
                    </Layer>
                    <Layer>
                        {Object.entries(pixels).map(([key, color], i) => {
                            const [x, y] = key.split(',').map(Number);
                            return (
                                <Rect
                                    key={`pixel-${i}`}
                                    x={x}
                                    y={y}
                                    width={gridSize}
                                    height={gridSize}
                                    fill={color}
                                />
                            );
                        })}
                    </Layer>
                </Stage>
            </div>
        );
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
                            if (formData.image) {
                                handleSubmit();
                            } else {
                                showAlert("Please select an image first.");
                            }
                        }}>
                            <div className="upload-menu my-14">
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="image"
                                        name="image"
                                        ref={fileInputRef}
                                        style={{ display: "none" }}
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
                                                <button
                                                    type="submit"
                                                    className="upload-button submit-button"
                                                    disabled={isUploading}
                                                >
                                                    {isUploading ? "Saving..." : "Save"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Scheduling Section: Role-based UI */}
                            {previewUrl && (
                                <div className="scheduling-section">
                                    <h3 className="upload-text">Schedule Options</h3>

                                    {/* Common field for all users */}
                                    <div>
                                        <label>Start Time:</label>
                                        <input
                                            type="datetime-local"
                                            value={scheduleData.start_time}
                                            onChange={(e) =>
                                                setScheduleData({ ...scheduleData, start_time: e.target.value })
                                            }
                                        />
                                    </div>
                                    {/* Admin-only advanced options */}
                                    {hasRole('admin') && (
                                        <>
                                            <div>
                                                <label>Duration (seconds):</label>
                                                <input
                                                    type="number"
                                                    min="60"
                                                    value={scheduleData.duration}
                                                    onChange={(e) =>
                                                        setScheduleData({ ...scheduleData, duration: e.target.value })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label>End Time (optional):</label>
                                                <input
                                                    type="datetime-local"
                                                    value={scheduleData.end_time}
                                                    onChange={(e) =>
                                                        setScheduleData({ ...scheduleData, end_time: e.target.value })
                                                    }
                                                />
                                            </div>
                                            <div className="override-row">
                                                <input
                                                    type="checkbox"
                                                    id="override-current"
                                                    checked={scheduleData.override_current}
                                                    onChange={(e) => setScheduleData({
                                                        ...scheduleData,
                                                        override_current: e.target.checked
                                                    })}
                                                />
                                                <label for="override-current">Override Current Active Image</label>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </form>
                        {previewUrl && (
                            <button
                                type="button"
                                className="upload-button queue-button"
                                onClick={handleAddToQueue}
                                disabled={isAddingToQueue || !newDesignId}
                            >
                                {isAddingToQueue ? "Adding to Rotation..." : "Add to Rotation"}
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
                        <h3 className="upload-text mb-4">Original Preview:</h3>
                        <p className="upload-p mb-4">
                            {formData.image ? `Selected file: ${formData.image.name}` : "No file selected"}
                        </p>
                        {isConverting ? (
                            <div>Converting image to pixels...</div>
                        ) : (
                            <>
                                <img src={previewUrl} alt="Original Preview" className="original-preview" />
                                {Object.keys(pixels).length > 0 && renderPixelPreview()}
                            </>
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

export default UploadPage;