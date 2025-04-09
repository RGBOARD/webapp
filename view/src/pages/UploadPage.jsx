import "../components/styles/Menu.css";
import "../components/styles/Upload.css";
import { useAuth } from '../auth/authContext'
import {useState, useRef, useEffect} from "react";

function UploadPage() {
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
    user_id: '',
    title: '',
    image: null,
  });

  const { currentUser } = useAuth();
  const { upload } = useAuth();
  const userid = currentUser?.user_id
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
      fileInputRef.current.value = '';  // Reset the file input value
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

  const handleAddToQueue = () => {
      console.log("Added to queue");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();

    form.append('user_id', userid);

    if (formData.image) {
      form.append('title', formData.title);
      form.append('image', formData.image); // Add the image file to FormData
    }

    try {
      const response = await upload(form)

      if (response.status === 201) {
        console.log('Image uploaded successfully');
      } else {
        console.log('Image upload failed');
      }
    } catch (error) {
      console.error('Error during upload:', error);
    }
  };

  return (
      <div className="uploadpage">
          <div className="upload-wrapper">
                  <h1 className="upload-h1">Upload an Image</h1>
              <div className="upload-menu-wrapper">
                  <div className="upload-column">
                      <h2 className="upload-text text-2xl"> Select an Image File to Upload: </h2>
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
                                              <button type="button" className="upload-button delete-button"
                                                      onClick={handleImageDelete}>Delete
                                              </button>
                                              <button type="submit" className="upload-button submit-button">Upload
                                              </button>
                                          </div>
                                          <button type="button" className="upload-button queue-button"
                                                  onClick={handleAddToQueue}>Add to Queue
                                          </button>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </form>
                  </div>
                  <div className="preview-column">
                      <h3 className="upload-text mb-4"> Preview: </h3>
                      <p className="upload-p mb-4">
                          {formData.image ? `Selected file: ${formData.image.name}` : "No file selected"}
                      </p>
                      <img src={previewUrl}/>
                  </div>
              </div>
          </div>
      </div>
  );
}

export default UploadPage;