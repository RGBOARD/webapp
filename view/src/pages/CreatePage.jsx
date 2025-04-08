import { useRef, useEffect } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import "../components/styles/Menu.css";
import "./styles/CreatePage.css";

// Import components
import ToolPanel from "../components/ToolPanel";
import ColorPickerPanel from "../components/ColorPickerPanel";

// Import custom hooks
import useColorManagement from "../hooks/useColorManagement";
import useDrawing from "../hooks/useDrawing";
import useZoomPan from "../hooks/useZoomPan";

function CreatePage() {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  
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
  const canvasSize = { width: 512, height: 512 }; // 64 cells × 8 pixels = 512px
  
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
  
  const handleColorPick = (color) => {
    if (color) {
      // Update the color in useColorManagement
      handleColorChange(color);
    }
  };

  // Initialize drawing functionality
  const {
    pixels,
    isDrawing,
    selectedTool,
    handleToolSelect,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleUndo,
    handleRedo,
    handleClear
  } = useDrawing(stageRef, selectedColor, scale, position, gridSize, canvasSize, handleColorPick);
  
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

  const handleUpload = () => {
    const stage = stageRef.current;
    if (stage) {
      const dataURL = stage.toDataURL();
      console.log("Ready to upload:", dataURL);
      alert("Image ready to upload to queue!");
    }
  };

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
          handleUpload={handleUpload}
        />
      </div>
    </div>
  );
}

export default CreatePage;