import { useState, useEffect } from "react";

function useZoomPan(containerRef) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e) => {
    // Make sure preventDefault is available before calling it
    if (e.evt && typeof e.evt.preventDefault === 'function') {
      e.evt.preventDefault();
    } else if (typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    // Get pointer position relative to stage
    const pointerPos = e.target.getStage().getPointerPosition();
    
    // Calculate new scale
    const oldScale = scale;
    const scaleBy = 1.1;
    
    // Handle both direct deltaY and nested evt.deltaY
    const delta = e.evt ? e.evt.deltaY : e.deltaY;
    const newScale = delta > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    
    // Limit scale to reasonable bounds (0.25 to 10)
    const limitedScale = Math.min(Math.max(0.25, newScale), 10);
    
    // Calculate new position
    if (pointerPos) {
      // Get pointer position relative to stage
      const mousePointTo = {
        x: (pointerPos.x - position.x) / oldScale,
        y: (pointerPos.y - position.y) / oldScale,
      };
      
      // Calculate new position
      const newPos = {
        x: pointerPos.x - mousePointTo.x * limitedScale,
        y: pointerPos.y - mousePointTo.y * limitedScale,
      };
      
      setPosition(newPos);
    }
    
    setScale(limitedScale);
  };

  const handleCanvasDragStart = (e) => {
    // Make sure e.evt exists
    if (e.evt) {
      // Only start dragging if right mouse button is pressed or space is held
      if (e.evt.button === 2 || e.evt.button === 1) { // Right or middle mouse button
        if (typeof e.evt.preventDefault === 'function') {
          e.evt.preventDefault();
        }
        setIsDragging(true);
        setDragStart({
          x: e.evt.clientX - position.x,
          y: e.evt.clientY - position.y
        });
      }
    }
  };
  
  const handleCanvasDragMove = (e) => {
    if (isDragging && e.evt) {
      if (typeof e.evt.preventDefault === 'function') {
        e.evt.preventDefault();
      }
      setPosition({
        x: e.evt.clientX - dragStart.x,
        y: e.evt.clientY - dragStart.y
      });
    }
  };
  
  const handleCanvasDragEnd = () => {
    setIsDragging(false);
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale * 1.2, 10));
  };
  
  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale / 1.2, 0.25));
  };
  
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Keyboard handler for space key + mouse drag panning
  const handleKeyDown = (e) => {
    if (e.code === 'Space') {
      document.body.style.cursor = 'grab';
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
    }
  };
  
  const handleKeyUp = (e) => {
    if (e.code === 'Space') {
      document.body.style.cursor = 'default';
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
    }
  };

  // Set up event listeners for zoom/pan
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Prevent default scroll behavior on the canvas container
      const preventScroll = (e) => {
        if (typeof e.preventDefault === 'function') {
          e.preventDefault();
        }
      };
      container.addEventListener('wheel', preventScroll, { passive: false });
      
      // Add keyboard event listeners for space + drag panning
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      
      return () => {
        container.removeEventListener('wheel', preventScroll);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [containerRef]);

  // Set up keyboard navigation with arrow keys
  useEffect(() => {
    const handleKeyboardNavigation = (e) => {
      // Move with arrow keys when zoomed in
      if (scale > 1) {
        const moveAmount = 20 / scale;
        switch(e.key) {
          case 'ArrowUp':
            if (typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            setPosition(prev => ({ ...prev, y: prev.y + moveAmount }));
            break;
          case 'ArrowDown':
            if (typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            setPosition(prev => ({ ...prev, y: prev.y - moveAmount }));
            break;
          case 'ArrowLeft':
            if (typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            setPosition(prev => ({ ...prev, x: prev.x + moveAmount }));
            break;
          case 'ArrowRight':
            if (typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            setPosition(prev => ({ ...prev, x: prev.x - moveAmount }));
            break;
          default:
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyboardNavigation);
    return () => window.removeEventListener('keydown', handleKeyboardNavigation);
  }, [scale]);

  return {
    scale,
    position,
    isDragging,
    dragStart,
    setDragStart,
    handleWheel,
    handleCanvasDragStart,
    handleCanvasDragMove,
    handleCanvasDragEnd,
    zoomIn,
    zoomOut,
    resetZoom
  };
}

export default useZoomPan;