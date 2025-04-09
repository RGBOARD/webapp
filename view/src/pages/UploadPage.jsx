import "../components/styles/Menu.css";
import "../components/styles/Upload.css";
import {useAuth} from '../auth/authContext.js';
import {useState, useRef, useEffect} from "react";
import axios from '../api/axios';

function UploadPage() {
    const fileInputRef = useRef(null);

    // Existing file upload form data
    const [formData, setFormData] = useState({
        user_id: '',
        title: '',
        image: null,
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

    const {currentUser} = useAuth();
    const {upload} = useAuth();
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
        e.preventDefault();
        const form = new FormData();
        form.append('user_id', userid);
        if (formData.image) {
            form.append('title', formData.title);
            form.append('image', formData.image);
        }
        try {
            const response = await upload(form);
            console.log("Upload response:", response.data);
            if (response.status === 201 && response.data.design_id) {
                console.log('Image uploaded successfully with design_id:', response.data.design_id);
                setNewDesignId(response.data.design_id);
            } else {
                console.log('Image upload failed or design_id not returned');
            }
        } catch (error) {
            console.error('Error during upload:', error);
        }
    };

    // Add the uploaded design to the queue with scheduling data
    const handleAddToQueue = async () => {
        // First, enforce the scheduling rule:
        const start = new Date(scheduleData.start_time);
        const end = new Date(scheduleData.end_time);
        if (!(start < end)) {
            setQueueMessage("Error: Start time must be before End time.");
            return;
        }

        if (!newDesignId) {
            console.error("No design ID available. Please upload an image first.");
            setQueueMessage("Please upload an image first.");
            return;
        }
        try {
            const queueData = {
                design_id: newDesignId,
                panel_id: 1,
                start_time: scheduleData.start_time,
                end_time: scheduleData.end_time,
                display_duration: 60, // Default duration (adjust if needed)
                display_order: 1,     // Default order
                scheduled: 1,         // Mark as scheduled
                scheduled_at: new Date().toISOString() // Current timestamp
            };
            const response = await axios.post('/queue_item', queueData);
            console.log("Added to queue:", response.data);
            // Set the success message from the backend or fallback to a default message
            if (response.data.message) {
                setQueueMessage(response.data.message);
            } else {
                setQueueMessage("Image successfully added to queue.");
            }
        } catch (error) {
            console.error("Error adding to queue:", error);
            setQueueMessage("Error adding image to queue.");
        }
    };

    return (
        <div className="uploadpage">
            <div className="upload-wrapper">
                <h1 className="upload-h1">Upload an Image</h1>
                <div className="upload-menu-wrapper">
                    <div className="upload-column">
                        <h2 className="upload-text text-2xl">Select an Image File to Upload:</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="upload-menu my-14">
                                <div>
                                    <input
                                        type="file"
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
                                                    Upload
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Scheduling Section: Only Start and End Date/Time */}
                            <div className="scheduling-section">
                                <h3>Schedule</h3>
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
                        <img src={previewUrl} alt="Preview"/>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UploadPage;
