import {useEffect, useRef, useState} from "react";
import {Layer, Line, Rect, Stage} from "react-konva";
import {useAuth} from '../auth/authContext.js';
import {useLocation, useNavigate} from 'react-router-dom';
import "../components/styles/Menu.css";
import "./styles/CreatePage.css";
import "./styles/EditPage.css";

// Import components
import ToolPanel from "../components/ToolPanel";
import ColorPickerPanel from "../components/ColorPickerPanel";
import Modal from "../components/Modal";

// Import custom hooks
import useColorManagement from "../hooks/useColorManagement";
import useDrawing from "../hooks/useDrawing";
import useZoomPan from "../hooks/useZoomPan";

// Import utilities
import axios from "../api/axios";

function EditPage() {
    const stageRef = useRef(null);
    const containerRef = useRef(null);
    const {currentUser} = useAuth();
    const [fileName, setFileName] = useState('');
    const [designId, setDesignId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null, // 'alert' or 'confirm'
        message: '',
        onConfirm: () => {
        },
        onCancel: () => {
        }
    });

    // Initialize color management
    const {
        selectedColor,
        hexColor,
        rgbValues,
        hsvValues,
        handleColorChange,
        handleRGBChange,
        handleHSVChange,
        colorSliderRef
    } = useColorManagement();

    // Initialize canvas size and grid
    const gridSize = 8; // 8 pixels per cell for a 64x64 grid
    const canvasSize = {width: 512, height: 512}; // 64 cells × 8 pixels = 512px

    // Initialize zoom and pan functionality
    const {
        scale,
        position,
        isDragging,
        handleWheel,
        handleCanvasDragStart,
        handleCanvasDragMove,
        handleCanvasDragEnd,
        zoomIn,
        zoomOut,
        resetZoom,
        dragStart,
        setDragStart
    } = useZoomPan(containerRef);

    const handleColorPicked = (color) => {
        // This updates all the color state in useColorManagement
        handleColorChange(color);
      };

    // Initialize drawing functionality - we'll use setPixels from useDrawing
    const {
        pixels,
        setPixels, // Using this method to load existing pixels
        isDrawing,
        selectedTool,
        handleToolSelect,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleUndo,
        handleRedo,
        handleClear
    } = useDrawing(stageRef, selectedColor, scale, position, gridSize, canvasSize, handleColorPicked);

    // Load design data from the state passed via react-router
    useEffect(() => {
        const loadDesign = async () => {
            setIsLoading(true);
            try {
                // Check if design data was passed through location state
                if (location.state && location.state.design) {
                    const design = location.state.design;
                    setFileName(design.title || '');
                    setDesignId(design.design_id);

                    // If pixel_data is already included in the passed design
                    if (design.pixel_data) {
                        // Use setPixels to directly set the pixels
                        const pixelData = typeof design.pixel_data === 'string'
                            ? JSON.parse(design.pixel_data)
                            : design.pixel_data;

                        setPixels(pixelData);
                        setIsLoading(false);
                    }
                    // If design_id is provided but not pixel_data, fetch from API
                    else if (design.design_id) {
                        await fetchDesignData(design.design_id);
                        setIsLoading(false);
                    }
                }
                // If no design was passed but there's a design_id in the URL
                else if (location.search) {
                    const params = new URLSearchParams(location.search);
                    const id = params.get('id');
                    if (id) {
                        setDesignId(parseInt(id));
                        await fetchDesignData(parseInt(id));
                        setIsLoading(false);
                    } else {
                        showAlert('No design ID provided. Creating a new design instead.');
                        setIsLoading(false);
                    }
                } else {
                    showAlert('No design data provided. Creating a new design instead.');
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Failed to load design:", error);
                showAlert('Error loading design. Creating a new design instead.');
                setIsLoading(false);
            }
        };

        loadDesign();
    }, [location]);

    useEffect(() => {
        if (!isLoading) {
          // Force re-initialization of the color slider
          setTimeout(() => {
            if (typeof colorSliderRef.current?.initializeColorSlider === 'function') {
              colorSliderRef.current.initializeColorSlider();
            }
          }, 200);
        }
      }, [isLoading]);

    // Function to fetch design data from the API
    const fetchDesignData = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/design/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.status === 200) {
                const design = response.data.design;
                setFileName(design.title || '');

                // Parse pixel data
                if (design.pixel_data) {
                    try {
                        const pixelData = typeof design.pixel_data === 'string'
                            ? JSON.parse(design.pixel_data)
                            : design.pixel_data;

                        // Use setPixels to directly set the pixels
                        setPixels(pixelData);
                    } catch (e) {
                        console.error("Error parsing pixel data:", e);
                    }
                }
            } else {
                throw new Error(response.data?.error || 'Failed to fetch design data');
            }
        } catch (error) {
            console.error("Error fetching design:", error);
            throw error;
        }
    };

    // Force resize handling on component mount
    useEffect(() => {
        // Trigger a window resize event to ensure components calculate sizes correctly
        window.dispatchEvent(new Event('resize'));

        // Force a redraw of the stage after a slight delay
        const timer = setTimeout(() => {
            if (stageRef.current) {
                stageRef.current.batchDraw();
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    // Generate grid lines
    const gridLines = [];
    for (let i = 0; i <= canvasSize.width; i += gridSize) {
        gridLines.push(
            <Line
                key={`v-${i}`}
                points={[i, 0, i, canvasSize.height]}
                stroke="#333333"
                strokeWidth={1}
                opacity={0.7}
            />
        );
    }

    for (let i = 0; i <= canvasSize.height; i += gridSize) {
        gridLines.push(
            <Line
                key={`h-${i}`}
                points={[0, i, canvasSize.width, i]}
                stroke="#333333"
                strokeWidth={1}
                opacity={0.7}
            />
        );
    }

    const handleFileNameChange = (value) => {
        setFileName(value);
    };

    const showAlert = (message, callback = () => {
    }) => {
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

    const showConfirm = (message, onConfirm, onCancel = () => {
    }) => {
        setModalState({
            isOpen: true,
            type: 'confirm',
            message: message.includes(fileName) ? message : `${message} "${fileName}"`,
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

    const handleUpdate = async () => {
        if (Object.keys(pixels).length === 0) {
            showAlert('Please draw something on the canvas before saving');
            return;
        }

        if (!fileName.trim()) {
            showAlert('Please enter a file name');
            return;
        }

        showConfirm(
            'Are you sure you want to update this design as',
            async () => {
                try {
                    const token = localStorage.getItem('token');

                    // Create FormData with pixel data and title
                    const form = new FormData();
                    form.append('title', fileName);

                    // Convert the pixels object to a JSON string
                    const pixelDataJSON = JSON.stringify(pixels);
                    form.append('pixel_data', pixelDataJSON);

                    // If we're updating an existing design
                    if (designId) {
                        const response = await axios.put(`/design/${designId}/image`, form, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data'
                            }
                        });

                        // Also update the title if needed
                        const titleResponse = await axios.put(`/design/${designId}/title`, form, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data'
                            }
                        });

                        if (response.data && response.status === 200) {
                            showAlert('Design updated successfully!', () => navigate('/view'));
                        } else {
                            showAlert(`Design update failed: ${response.data?.error || 'Unknown error'}`);
                        }
                    } else {
                        // If somehow there's no designId, handle as a new design creation
                        form.append('user_id', currentUser?.user_id);

                        const response = await axios.post('/design', form, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data'
                            }
                        });

                        if (response.data && response.status === 200) {
                            showAlert('New design saved successfully!', () => navigate('/view'));
                        } else {
                            showAlert(`Design save failed: ${response.data?.error || 'Unknown error'}`);
                        }
                    }
                } catch (error) {
                    const message = error.response?.data?.error || error.message;
                    showAlert(`Error during update: ${message}`);
                }
            }
        );
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading design...</p>
            </div>
        );
    }

    return (
        <div className="create-container">
            <div className="create-content">
                <ToolPanel
                    selectedTool={selectedTool}
                    handleToolSelect={handleToolSelect}
                    handleUndo={handleUndo}
                    handleRedo={handleRedo}
                    handleClear={handleClear}
                    scale={scale}
                    zoomIn={zoomIn}
                    zoomOut={zoomOut}
                    resetZoom={resetZoom}
                />

                <div className="canvas-area" ref={containerRef}>
                    <Stage
                        width={canvasSize.width}
                        height={canvasSize.height}
                        onMouseDown={(e) => {
                            // If right-clicking or middle-clicking, handle panning
                            if (e.evt && (e.evt.button === 2 || e.evt.button === 1)) {
                                handleCanvasDragStart(e);
                            } else {
                                handleMouseDown(e);
                            }
                        }}
                        onMouseMove={(e) => {
                            if (isDragging) {
                                handleCanvasDragMove(e);
                            } else {
                                handleMouseMove(e);
                            }
                        }}
                        onMouseUp={(e) => {
                            if (isDragging) {
                                handleCanvasDragEnd();
                            } else {
                                handleMouseUp();
                            }
                        }}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchMove={handleMouseMove}
                        onTouchEnd={handleMouseUp}
                        onWheel={handleWheel}
                        ref={stageRef}
                        scaleX={scale}
                        scaleY={scale}
                        x={position.x}
                        y={position.y}
                        onContextMenu={e => {
                            if (e.evt && typeof e.evt.preventDefault === 'function') {
                                e.evt.preventDefault();
                            }
                        }}
                    >
                        <Layer>
                            <Rect
                                width={canvasSize.width}
                                height={canvasSize.height}
                                fill="black"
                            />
                            {gridLines}
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

                    <div className="edit-mode-indicator">Edit Mode</div>
                </div>

                <ColorPickerPanel
                    selectedColor={selectedColor}
                    hexColor={hexColor}
                    rgbValues={rgbValues}
                    hsvValues={hsvValues}
                    handleColorChange={handleColorChange}
                    handleRGBChange={handleRGBChange}
                    handleHSVChange={handleHSVChange}
                    colorSliderRef={colorSliderRef}
                    handleSave={handleUpdate}
                    handleFileNameChange={handleFileNameChange}
                    fileName={fileName}
                />
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

export default EditPage;