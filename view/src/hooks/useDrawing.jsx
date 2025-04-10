import { useState, useEffect, useRef } from "react";

function useDrawing(stageRef, selectedColor, scale, position, gridSize, canvasSize, onColorPicked) {
  const [pixels, setPixels] = useState({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState("pencil");
  const [history, setHistory] = useState([{}]);  // Start with an empty canvas state
  const [historyIndex, setHistoryIndex] = useState(0);  // Start at index 0
  
  const isUndoRedoAction = useRef(false);
  const startDrawingPixels = useRef({});

  // Force stage re-render after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stageRef.current) {
        stageRef.current.batchDraw();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [stageRef]);

  // Add to history only when drawing is complete
  useEffect(() => {
    // Skip history updates during undo/redo
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    
    // Skip history updates during active drawing
    if (isDrawing) {
      return;
    }
    
    // If pixels have changed and we're not drawing, add to history
    if (Object.keys(pixels).length > 0 && JSON.stringify(pixels) !== JSON.stringify(history[historyIndex])) {
      const newHistoryIndex = historyIndex + 1;
      const newHistory = [...history.slice(0, newHistoryIndex), { ...pixels }];
      setHistory(newHistory);
      setHistoryIndex(newHistoryIndex);
    }
  }, [pixels, isDrawing, historyIndex, history]);

  const drawPixel = (x, y) => {
    const key = `${x},${y}`;
    setPixels(prev => ({
      ...prev,
      [key]: selectedColor
    }));
  };

  const erasePixel = (x, y) => {
    const key = `${x},${y}`;
    setPixels(prev => {
      const newPixels = { ...prev };
      delete newPixels[key];
      return newPixels;
    });
  };

  const fillArea = (startX, startY) => {
    const startKey = `${startX},${startY}`;
    const targetColor = pixels[startKey]; // This can be undefined for empty cells
    
    if (targetColor === selectedColor) return;
    
    // Flood fill algorithm
    const newPixels = { ...pixels };
    const queue = [[startX, startY]];
    const visited = new Set([startKey]);
    
    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = `${x},${y}`;
      
      newPixels[key] = selectedColor;
      
      // Check adjacent pixels (4-way connectivity)
      const directions = [
        [0, -gridSize], // up
        [gridSize, 0],  // right
        [0, gridSize],  // down
        [-gridSize, 0]  // left
      ];
      
      for (const [dx, dy] of directions) {
        const newX = x + dx;
        const newY = y + dy;
        
        // Skip if out of bounds
        if (newX < 0 || newX >= canvasSize.width || newY < 0 || newY >= canvasSize.height) {
          continue;
        }
        
        const newKey = `${newX},${newY}`;
        
        // Skip if already visited
        if (visited.has(newKey)) {
          continue;
        }
        
        visited.add(newKey);
        
        const pixelColor = pixels[newKey];
        
        if (targetColor === undefined) {
          // We're filling empty space
          if (pixelColor === undefined) {
            queue.push([newX, newY]);
          }
        } else {
          // We're replacing an existing color
          if (pixelColor === targetColor) {
            queue.push([newX, newY]);
          }
        }
      }
    }
    
    setPixels(newPixels);
  };

  const pickColor = (x, y) => {
    const key = `${x},${y}`;
    const color = pixels[key];
    if (color && onColorPicked) {
      onColorPicked(color);
    }
  };

  const handleMouseDown = (e) => {
    // Store current pixels state before starting to draw
    startDrawingPixels.current = { ...pixels };
    
    setIsDrawing(true);
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
    // Apply scale and offset transformation to get the actual canvas coordinates
    const x = Math.floor((pointerPos.x - position.x) / scale / gridSize) * gridSize;
    const y = Math.floor((pointerPos.y - position.y) / scale / gridSize) * gridSize;
    
    if (selectedTool === 'pencil') {
      drawPixel(x, y);
    } else if (selectedTool === 'eraser') {
      erasePixel(x, y);
    } else if (selectedTool === 'fill') {
      fillArea(x, y);
    } else if (selectedTool === 'pipette') {
      pickColor(x, y);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
    // Apply scale and offset transformation to get the actual canvas coordinates
    const x = Math.floor((pointerPos.x - position.x) / scale / gridSize) * gridSize;
    const y = Math.floor((pointerPos.y - position.y) / scale / gridSize) * gridSize;
    
    if (selectedTool === 'pencil') {
      drawPixel(x, y);
    } else if (selectedTool === 'eraser') {
      erasePixel(x, y);
    }
  };

  const handleMouseUp = () => {
    // If we were drawing and pixels changed, manually add to history when drawing ends
    if (isDrawing && JSON.stringify(pixels) !== JSON.stringify(startDrawingPixels.current)) {
      const newHistoryIndex = historyIndex + 1;
      const newHistory = [...history.slice(0, newHistoryIndex), { ...pixels }];
      setHistory(newHistory);
      setHistoryIndex(newHistoryIndex);
    }
    
    setIsDrawing(false);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      isUndoRedoAction.current = true;
      setHistoryIndex(newIndex);
      setPixels(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      isUndoRedoAction.current = true;
      setHistoryIndex(newIndex);
      setPixels(history[newIndex]);
    }
  };

  const handleClear = () => {
    const emptyPixels = {};
    
    // Add to history
    const newHistoryIndex = historyIndex + 1;
    const newHistory = [...history.slice(0, newHistoryIndex), emptyPixels];
    
    isUndoRedoAction.current = true;
    setHistory(newHistory);
    setHistoryIndex(newHistoryIndex);
    setPixels(emptyPixels);
  };

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
  };

  // Set up viewport meta tag to prevent browser-level pinch zoom on mobile
  useEffect(() => {
    let metaTag = document.querySelector('meta[name="viewport"]');
    const originalContent = metaTag?.getAttribute('content');
    
    if (metaTag) {
      metaTag.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    } else {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'viewport');
      metaTag.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      document.head.appendChild(metaTag);
    }
    
    return () => {
      metaTag = document.querySelector('meta[name="viewport"]');
      if (metaTag && originalContent) {
        metaTag.setAttribute('content', originalContent);
      } else if (metaTag) {
        metaTag.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  return {
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
  };
}

export default useDrawing;