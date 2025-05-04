import "../components/styles/Menu.css";
import "./styles/Upload.css";
import { useAuth } from '../auth/authContext.js';
import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { convertImageToPixels } from "../utils/imageConverter";
import Modal from "../components/Modal";
import { useNavigate } from 'react-router-dom';

function UploadPage() {
  const fileInputRef = useRef(null);
  const stageRef = useRef(null);

  const navigate = useNavigate();

  // Pixel art canvas settings
  const gridSize = 8;
  const canvasSize = { width: 512, height: 512 };

  // Form state
  const [formData, setFormData] = useState({
    user_id: "",
    title: "",
    image: null,
  });

  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'alert' or 'confirm'
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Pixel preview state
  const [pixels, setPixels] = useState({});
  const [isConverting, setIsConverting] = useState(false);
  const [pixelatedPreviewUrl, setPixelatedPreviewUrl] = useState(null);

  const { currentUser, upload } = useAuth();
  const userid = currentUser?.user_id;
  const [previewUrl, setPreviewUrl] = useState(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (pixelatedPreviewUrl) URL.revokeObjectURL(pixelatedPreviewUrl);
    };
  }, [previewUrl, pixelatedPreviewUrl]);

  // File chooser → preview + pixel conversion
  const handleFileChange = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    // Preview URL
    const objectUrl = URL.createObjectURL(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(objectUrl);

    setFormData((fd) => ({
      ...fd,
      image: file,
      title: file.name,
    }));

    // Convert to pixels
    setIsConverting(true);
    try {
      const { pixels, pixelatedDataURL } = await convertImageToPixels(file);
      setPixels(pixels);
      setPixelatedPreviewUrl(pixelatedDataURL);
    } catch (err) {
      console.error(err);
      showAlert("Error converting image to pixels");
    } finally {
      setIsConverting(false);
    }
  };

  const showAlert = (message, cb = () => {}) => {
    setModalState({
      isOpen: true,
      type: "alert",
      message,
      onConfirm: () => {
        setModalState((m) => ({ ...m, isOpen: false }));
        cb();
      },
      onCancel: () => setModalState((m) => ({ ...m, isOpen: false })),
    });
  };

  const showConfirm = (message, onConfirm, onCancel = () => {}) => {
    setModalState({
      isOpen: true,
      type: "confirm",
      message: message.includes(formData.image?.name)
        ? message
        : `${message} "${formData.image?.name}"`,
      onConfirm: () => {
        setModalState((m) => ({ ...m, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setModalState((m) => ({ ...m, isOpen: false }));
        onCancel();
      },
    });
  };

  const handleImageDelete = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (pixelatedPreviewUrl) URL.revokeObjectURL(pixelatedPreviewUrl);
    setPreviewUrl(null);
    setPixelatedPreviewUrl(null);
    setPixels({});
    setFormData((fd) => ({ ...fd, image: null }));
  };

  // Upload to /design endpoint
  const handleSubmit = async () => {
    if (Object.keys(pixels).length === 0) {
      showAlert("Please draw something on the canvas before saving");
      return;
    }
    if (!formData.title?.trim()) {
      showAlert("Please enter a file name");
      return;
    }

    showConfirm(
      "Are you sure you want to save this design?",
      async () => {
        try {
          const form = new FormData();
          form.append("user_id", userid);
          form.append("title", formData.title);
          form.append("pixel_data", JSON.stringify(pixels));

          const result = await upload(form);
          if (result.success) {
            showAlert('Design saved successfully!', () => {navigate('/'); });
          } else {
            showAlert(`Design save failed: ${result.error}`);
          }
        } catch (err) {
          console.error(err);
          showAlert(`Error during save: ${err.message}`);
        }
      }
    );
  };

  // Render the 64×64 pixel preview with Konva
  const renderPixelPreview = () => (
    <div className="pixelated-preview">
      <h3 className="upload-text mb-4">64×64 Pixel Preview:</h3>
      <Stage width={canvasSize.width} height={canvasSize.height} ref={stageRef}>
        <Layer>
          <Rect width={canvasSize.width} height={canvasSize.height} fill="black" />
        </Layer>
        <Layer>
          {Object.entries(pixels).map(([key, color], i) => {
            const [x, y] = key.split(",").map(Number);
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

          {/* Left: file chooser & save */}
          <div className="upload-column">
            <h2 className="upload-text text-2xl">Select an Image File to Save:</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                formData.image ? handleSubmit() : showAlert("Please select an image first.");
              }}
            >
              <div className="upload-menu my-14">
                <input
                  type="file"
                  accept="image/*"
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
                )}
              </div>
            </form>
          </div>

          {/* Right: previews */}
          <div className="preview-column">
            <h3 className="upload-text mb-4">Original Preview:</h3>
            <p className="upload-p mb-4">
              {formData.image ? `Selected file: ${formData.image.name}` : "No file selected"}
            </p>
            {isConverting ? (
              <div>Converting image to pixels...</div>
            ) : (
              <>
                {previewUrl && (
                  <img src={previewUrl} alt="Original Preview" className="original-preview" />
                )}
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
