import { useState, useEffect, useRef } from "react";
import { colorUtils } from "../utils/colorUtils";

function useColorManagement() {
  const [selectedColor, setSelectedColor] = useState("#edf2c4");
  const [hexColor, setHexColor] = useState("#edf2c4");
  const [rgbValues, setRgbValues] = useState({ r: 237, g: 242, b: 196 });
  const [hsvValues, setHsvValues] = useState({ h: 65, s: 100, v: 100 });
  const colorSliderRef = useRef(null);
  const canvasRef = useRef(null);
  const indicatorRef = useRef(null);
  const isInitialized = useRef(false);

  // Initialize color slider with gradient
  const initializeColorSlider = () => {
    if (!colorSliderRef.current) return;
    
    // Clear previous content
    while (colorSliderRef.current.firstChild) {
      colorSliderRef.current.removeChild(colorSliderRef.current.firstChild);
    }
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    
    // Set canvas dimensions
    canvas.width = colorSliderRef.current.clientWidth || 200;
    canvas.height = colorSliderRef.current.clientHeight || 20;
    
    // Draw gradient
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    
    // Add color stops for the full hue spectrum
    for (let i = 0; i <= 360; i += 30) {
      const color = colorUtils.hsvToHex(i, 100, 100);
      gradient.addColorStop(i / 360, color);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Append canvas to slider
    colorSliderRef.current.appendChild(canvas);
    
    // Create indicator
    const indicator = document.createElement('div');
    indicatorRef.current = indicator;
    indicator.style.position = 'absolute';
    indicator.style.width = '4px';
    indicator.style.height = '26px';
    indicator.style.backgroundColor = 'white';
    indicator.style.border = '1px solid black';
    indicator.style.borderRadius = '2px';
    indicator.style.top = '-3px';
    indicator.style.transform = 'translateX(-2px)';
    indicator.style.pointerEvents = 'none';
    colorSliderRef.current.style.position = 'relative';
    colorSliderRef.current.appendChild(indicator);
    
    // Add event listeners for slider
    const handleSliderClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const ratio = x / rect.width;
      const hue = Math.round(ratio * 360);
      updateColorFromHue(hue);
    };
    
    canvas.addEventListener('click', handleSliderClick);
    
    canvas.addEventListener('mousedown', (e) => {
      handleSliderClick(e);
      
      const moveHandler = (moveEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
        const ratio = x / rect.width;
        const hue = Math.round(ratio * 360);
        updateColorFromHue(hue);
      };
      
      const upHandler = () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
      };
      
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
    });
    
    // Update slider position initially
    updateSliderPosition(hsvValues.h);
    
    isInitialized.current = true;
  };

  // Handle color change for all inputs (hex, rgb, hsv)
  const handleColorChange = (color) => {
    setHexColor(color);
    
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      setSelectedColor(color);
      
      const rgb = colorUtils.hexToRgb(color);
      setRgbValues(rgb);
      
      const hsv = colorUtils.rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsvValues(hsv);
      
      updateSliderPosition(hsv.h);
    } 
    else if (/^[0-9A-Fa-f]{6}$/.test(color)) {
      const validColor = '#' + color;
      setSelectedColor(validColor);
      
      const rgb = colorUtils.hexToRgb(validColor);
      setRgbValues(rgb);
      
      const hsv = colorUtils.rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsvValues(hsv);
      
      updateSliderPosition(hsv.h);
    }
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
    
    updateSliderPosition(hsv.h);
  };

  const handleHSVChange = (component, value) => {
    let newValue;
    if (component === 'h') {
      newValue = Math.max(0, Math.min(360, parseInt(value) || 0));
    } else {
      newValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    }
    
    const newHsvValues = { ...hsvValues, [component]: newValue };
    setHsvValues(newHsvValues);
    
    const rgb = colorUtils.hsvToRgb(newHsvValues.h, newHsvValues.s, newHsvValues.v);
    setRgbValues(rgb);
    
    const hex = colorUtils.rgbToHex(rgb.r, rgb.g, rgb.b);
    setHexColor(hex);
    setSelectedColor(hex);
    
    updateSliderPosition(newHsvValues.h);
  };

  const updateColorFromHue = (hue) => {
    const newHsvValues = { ...hsvValues, h: hue };
    setHsvValues(newHsvValues);
    
    const rgb = colorUtils.hsvToRgb(hue, hsvValues.s, hsvValues.v);
    setRgbValues(rgb);
    
    const hex = colorUtils.rgbToHex(rgb.r, rgb.g, rgb.b);
    setHexColor(hex);
    setSelectedColor(hex);
    
    updateSliderPosition(hue);
  };

  const updateSliderPosition = (hue) => {
    if (!indicatorRef.current || !colorSliderRef.current) return;
    
    const sliderWidth = colorSliderRef.current.clientWidth || 200;
    const position = (hue / 360) * sliderWidth;
    
    indicatorRef.current.style.left = `${position}px`;
  };

  // Initialize color slider on component mount
  useEffect(() => {
    // Add a small delay to ensure the DOM is ready
    const timer = setTimeout(() => {
      initializeColorSlider();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Re-initialize on window resize
  useEffect(() => {
    const handleResize = () => {
      initializeColorSlider();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update slider position when hue changes
  useEffect(() => {
    if (isInitialized.current) {
      updateSliderPosition(hsvValues.h);
    }
  }, [hsvValues.h]);

  return {
    selectedColor,
    hexColor,
    rgbValues,
    hsvValues,
    handleColorChange,
    handleRGBChange,
    handleHSVChange,
    colorSliderRef,
    initializeColorSlider
  };
}

export default useColorManagement;