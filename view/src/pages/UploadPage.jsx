import "../components/styles/Menu.css";
import "./styles/Upload.css";
import { useAuth } from '../auth/authContext.js';
import { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Stage, Layer, Rect } from "react-konva";
import { convertImageToPixels } from "../utils/imageConverter";
import Modal from "../components/Modal";

export default function UploadPage() {
  const fileInputRef = useRef(null);
  const stageRef = useRef(null);
  const navigate = useNavigate();

  // Pixel art canvas settings
  const gridSize = 8;
  const canvasSize = { width: 512, height: 512 };

  // Upload form state
  const [formData, setFormData] = useState({
    user_id: '',
    title: '',
    image: null,
  });

  // Modal state for alerts/confirms
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Pixel preview state
  const [pixels, setPixels] = useState({});
  const [isConverting, setIsConverting] = useState(false);
  const [pixelatedPreviewUrl, setPixelatedPreviewUrl] = useState(null);

  const { currentUser, upload } = useAuth();
  const userid = currentUser?.user_id;
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (pixelatedPreviewUrl) URL.revokeObjectURL(pixelatedPreviewUrl);
    };
  }, [previewUrl, pixelatedPreviewUrl]);

  const showAlert = (message, callback = () => {}) => {
    setModalState({
      isOpen: true,
      type: 'alert',
      message,
      onConfirm: () => { setModalState(m => ({ ...m, isOpen: false })); callback(); },
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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    setFormData(d => ({ ...d, image: file, title: file.name }));

    // Convert to pixel data
    setIsConverting(true);
    try {
      const { pixels, pixelatedDataURL } = await convertImageToPixels(file);
      setPixels(pixels);
      setPixelatedPreviewUrl(pixelatedDataURL);
    } catch (err) {
      console.error(err);
      showAlert('Error converting image to pixels');
    } finally {
      setIsConverting(false);
    }
  };

  const handleImageDelete = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (pixelatedPreviewUrl) URL.revokeObjectURL(pixelatedPreviewUrl);
    setPreviewUrl(null);
    setPixelatedPreviewUrl(null);
    setPixels({});
    setFormData(d => ({ ...d, image: null, title: '' }));
  };

  const handleSubmit = async () => {
    if (!formData.image) {
      showAlert('Please select an image first');
      return;
    }
    if (Object.keys(pixels).length === 0) {
      showAlert('Please draw something before saving');
      return;
    }

    showConfirm(
      'Save this design?',
      async () => {
        setIsUploading(true);
        const data = new FormData();
        data.append('user_id', userid);
        data.append('title', formData.title);
        data.append('pixel_data', JSON.stringify(pixels));

        try {
          const result = await upload(data);
          if (result.success) {
            showAlert('Design saved!', () => navigate(-1));
          } else {
            showAlert(`Save failed: ${result.error}`);
          }
        } catch (err) {
          console.error(err);
          showAlert('Unknown error saving design');
        } finally {
          setIsUploading(false);
        }
      }
    );
  };

  const renderPixelPreview = () => (
    <div className="pixelated-preview">
      <h3 className="upload-text mb-4">64×64 Pixel Preview:</h3>
      <Stage width={canvasSize.width} height={canvasSize.height} ref={stageRef}>
        <Layer>
          <Rect width={canvasSize.width} height={canvasSize.height} fill="black" />
        </Layer>
        <Layer>
          {Object.entries(pixels).map(([coord, color], i) => {
            const [x, y] = coord.split(',').map(Number);
            return <Rect key={i} x={x} y={y} width={gridSize} height={gridSize} fill={color} />;
          })}
        </Layer>
      </Stage>
    </div>
  );

  return (
    <div className="uploadpage">
      <div className="upload-wrapper">
        <h1 className="upload-h1">Save an Image</h1>
        <div className="upload-menu-wrapper">
          <div className="upload-column">
            <h2 className="upload-text text-2xl">Select an Image to Save:</h2>
            <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
              <div className="upload-menu my-14">
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                <button type="button" className="upload-button choose-button" onClick={() => fileInputRef.current.click()}>
                  Choose File
                </button>
                {previewUrl && (
                  <div className="choose-row">
                    <button type="button" className="upload-button delete-button" onClick={handleImageDelete}>
                      Delete
                    </button>
                    <button type="submit" className="upload-button submit-button" disabled={isUploading}>
                      {isUploading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="preview-column">
            {isConverting ? (
              <div>Converting image...</div>
            ) : (
              <>
                {previewUrl && <img src={previewUrl} alt="Preview" className="original-preview" />}
                {pixelatedPreviewUrl && renderPixelPreview()}
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
