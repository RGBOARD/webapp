import { useState, useEffect, useRef } from "react";
import { colorUtils } from "../utils/colorUtils";

function useColorManagement() {
  const [selectedColor, setSelectedColor] = useState("#edf2c4");
  const [hexColor, setHexColor] = useState("#edf2c4");
  const [rgbValues, setRgbValues] = useState({ r: 237, g: 242, b: 196 });
  const [hsvValues, setHsvValues] = useState({ h: 65, s: 100, v: 100 });
  const colorSliderRef = useRef(null);

  // Handle color change for all inputs (hex, rgb, hsv)
  const handleColorChange = (color) => {
    // Store the input value for updating the input field
    setHexColor(color);
    
    // Only process for color changes if it's a valid hex format
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      // Valid hex with # - process it
      setSelectedColor(color);
      
      const rgb = colorUtils.hexToRgb(color);
      setRgbValues(rgb);
      
      const hsv = colorUtils.rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsvValues(hsv);
    } 
    else if (/^[0-9A-Fa-f]{6}$/.test(color)) {
      // Valid hex without # - add it and process
      const validColor = '#' + color;
      setSelectedColor(validColor);
      
      const rgb = colorUtils.hexToRgb(validColor);
      setRgbValues(rgb);
      
      const hsv = colorUtils.rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsvValues(hsv);
    }
    // If it's not a valid format yet, we still keep the input value in the field
  };

  const handleRGBChange = (component, value) => {
    const newValue = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newRgbValues = { ...rgbValues, [component]: newValue };
    setRgbValues(newRgbValues);
    
    const hex = colorUtils.rgbToHex(newRgbValues.r, newRgbValues.g, newRgbValues.b);
    setHexColor(hex);
    setSelectedColor(hex);
    
    const hsv = colorUtils.rgbToHsv(newRgbValues.r, newRgbValues.g, newRgbValues.b);
    setHsvValues(hsv);
  };

  const handleHSVChange = (component, value) => {
    let newValue;
    if (component === 'h') {
      newValue = Math.max(0, Math.min(360, parseInt(value) || 0));
    } else {
      newValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    }
    
    const newHsvValues = { ...hsvValues, [component]: newValue };
    
    const rgb = colorUtils.hsvToRgb(newHsvValues.h, newHsvValues.s, newHsvValues.v);
    setRgbValues(rgb);
    
    const hex = colorUtils.rgbToHex(rgb.r, rgb.g, rgb.b);
    setHexColor(hex);
    setSelectedColor(hex);
    
    setHsvValues(newHsvValues);
    
    if (component === 'h') {
      updateSliderPosition(newHsvValues.h);
    }
  };

  const updateColorFromHue = (hue) => {
    const newHsvValues = { h: hue, s: 100, v: 100 };
    const rgb = colorUtils.hsvToRgb(hue, 100, 100);
    const hex = colorUtils.rgbToHex(rgb.r, rgb.g, rgb.b);
    
    setRgbValues(rgb);
    setHexColor(hex);
    setSelectedColor(hex);
    setHsvValues(newHsvValues);
  };

  const updateSliderPosition = (hue) => {
    const slider = colorSliderRef.current;
    if (!slider) return;
    
    let indicator = null;
    
    if (slider.children && slider.children.length > 1) {
      indicator = slider.children[1];
    } else if (slider.querySelector('div')) {
      indicator = slider.querySelector('div');
    }
    
    if (!indicator) return;
    
    const sliderWidth = slider.clientWidth || 200;
    const position = (hue / 360) * sliderWidth;
    
    indicator.style.left = `${position}px`;
  };

  useEffect(() => {
    const slider = colorSliderRef.current;
    if (slider) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set the size of the canvas - using a small timeout to ensure the element is rendered
      setTimeout(() => {
        canvas.width = slider.clientWidth || 200;
        canvas.height = slider.clientHeight || 20; 
        
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        
        // Add color stops for the full hue spectrum
        for (let i = 0; i <= 360; i += 30) {
          const color = colorUtils.hsvToHex(i, 100, 100);
          gradient.addColorStop(i / 360, color);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }, 50);
      
      slider.innerHTML = '';
      slider.appendChild(canvas);
      
      const indicator = document.createElement('div');
      indicator.style.position = 'absolute';
      indicator.style.width = '4px';
      indicator.style.height = '26px';
      indicator.style.backgroundColor = 'white';
      indicator.style.border = '1px solid black';
      indicator.style.borderRadius = '2px';
      indicator.style.top = '-3px';
      indicator.style.transform = 'translateX(-2px)';
      indicator.style.pointerEvents = 'none';
      slider.style.position = 'relative';
      slider.appendChild(indicator);
      
      setTimeout(() => {
        updateSliderPosition(hsvValues.h);
      }, 100);
      
      const handleSliderClick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const ratio = x / rect.width;
        
        // Get color from the gradient based on position
        const hue = Math.round(ratio * 360);
        updateColorFromHue(hue);
        updateSliderPosition(hue);
      };
      
      // Store references to event handlers so they can be removed in cleanup
      let moveHandler;
      let upHandler;
      
      canvas.addEventListener('click', handleSliderClick);
      canvas.addEventListener('mousedown', (e) => {
        moveHandler = (moveEvent) => {
          const rect = canvas.getBoundingClientRect();
          const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
          const ratio = x / rect.width;
          const hue = Math.round(ratio * 360);
          updateColorFromHue(hue);
          updateSliderPosition(hue);
        };
        
        upHandler = () => {
          document.removeEventListener('mousemove', moveHandler);
          document.removeEventListener('mouseup', upHandler);
        };
        
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
        
        handleSliderClick(e);
      });
      
      return () => {
        canvas.removeEventListener('click', handleSliderClick);
        // Only try to remove event listeners if they exist
        if (moveHandler) document.removeEventListener('mousemove', moveHandler);
        if (upHandler) document.removeEventListener('mouseup', upHandler);
      };
    }
  }, []);

  useEffect(() => {
    updateSliderPosition(hsvValues.h);
  }, [hsvValues.h]);

  // Prevent browser zoom on color slider
  useEffect(() => {
    const preventZoom = (e) => {
      if (e.ctrlKey && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
    };
  
    const preventZoomKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === '+' || e.key === '-' || e.key === '=') && 
          typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
    };
    
    window.addEventListener('wheel', preventZoom, { passive: false });
    window.addEventListener('keydown', preventZoomKeys);
    
    return () => {
      window.removeEventListener('wheel', preventZoom);
      window.removeEventListener('keydown', preventZoomKeys);
    };
  }, []);

  return {
    selectedColor,
    hexColor,
    rgbValues,
    hsvValues,
    handleColorChange,
    handleRGBChange,
    handleHSVChange,
    colorSliderRef
  };
}

export default useColorManagement;