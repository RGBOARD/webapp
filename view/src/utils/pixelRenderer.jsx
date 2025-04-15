/**
 * Renders pixel data to a canvas and returns the data URL
 * @param {Object} pixelData - Object with "x,y": "color" format
 * @param {number} width - The width of the pixel grid (default: 64)
 * @param {number} height - The height of the pixel grid (default: 64)
 * @param {number} scale - Scale factor for rendering (default: 1)
 * @param {string} background - Background color (default: #000000)
 * @returns {string} - Data URL of the rendered image
 */
export const renderPixelDataToImage = (pixelData, width = 64, height = 64, scale = 1, background = '#000000') => {
    // Safety check - if pixel data is invalid, return empty image
    if (!pixelData || typeof pixelData !== 'object') {
      console.warn('Invalid pixel data provided:', pixelData);
      // Return a small black image
      return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    }
  
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    
    // Fill with background color
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    try {
      // Calculate the pixel size based on scale and grid size
      const gridSize = 8; // As in your CreatePage
      const pixelSize = scale;
      
      // Draw pixels
      Object.entries(pixelData).forEach(([key, color]) => {
        try {
          const [x, y] = key.split(',').map(Number);
          
          // Validate color format
          let fillColor = color;
          if (!/^#[0-9A-Fa-f]{6}$/i.test(color) && !/^#[0-9A-Fa-f]{3}$/i.test(color)) {
            fillColor = '#FF00FF'; // Fallback to magenta if color is invalid
          }
          
          ctx.fillStyle = fillColor;
          ctx.fillRect(
            (x / gridSize) * scale, 
            (y / gridSize) * scale, 
            pixelSize, 
            pixelSize
          );
        } catch (pixelError) {
          console.warn('Error rendering pixel:', key, color, pixelError);
        }
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error rendering pixel data:', error);
      return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    }
  };