/**
 * Utility for converting images to a 64x64 pixel grid format
 */


/**
 * Converts an image to a 64x64 pixel grid with enhanced quality
 * @param {File} imageFile - The image file to convert
 * @returns {Promise<{pixels: Object, pixelatedDataURL: string}>}
 */
export const convertImageToPixels = (imageFile) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Step 1: Multi-stage scaling with intermediate canvas
          // Create intermediate canvas for better downscaling
          const intermediateCanvas = document.createElement('canvas');
          const intermediateCtx = intermediateCanvas.getContext('2d', { willReadFrequently: true });
          
          // Use a larger intermediate size for better quality
          intermediateCanvas.width = 256;
          intermediateCanvas.height = 256;
          
          // Enable image smoothing for the first downscale
          intermediateCtx.imageSmoothingEnabled = true;
          intermediateCtx.imageSmoothingQuality = 'high';
          
          // First downscale to 256x256 with high quality
          intermediateCtx.drawImage(img, 0, 0, 256, 256);
          
          // Apply unsharp mask to enhance edges in the intermediate image
          const unsharpedImageData = applyUnsharpMask(
            intermediateCtx.getImageData(0, 0, 256, 256),
            0.5, // Amount of sharpening (0-2)
            1    // Radius of effect
          );
          intermediateCtx.putImageData(unsharpedImageData, 0, 0);
          
          // Step 2: Final downscale to 64x64
          const finalCanvas = document.createElement('canvas');
          const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
          
          finalCanvas.width = 64;
          finalCanvas.height = 64;
          
          // Disable smoothing for the final downscale to keep details sharper
          finalCtx.imageSmoothingEnabled = false;
          
          // Draw from intermediate canvas to final canvas
          finalCtx.drawImage(intermediateCanvas, 0, 0, 64, 64);
          
          // Get the final image data
          const imageData = finalCtx.getImageData(0, 0, 64, 64);
          
          // Step 3: Convert to pixel format
          const pixels = {};
          const gridSize = 8;
          
          // Convert to CreatePage format - Important, this makes the pixel image able to be edited later
          for (let y = 0; y < 64; y++) {
            for (let x = 0; x < 64; x++) {
              const idx = (y * 64 + x) * 4;
              const r = imageData.data[idx];
              const g = imageData.data[idx + 1];
              const b = imageData.data[idx + 2];
              const a = imageData.data[idx + 3];
              
              // Skip fully transparent pixels
              if (a < 10) continue;
              
              // Format as hex color
              const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
              
              // Store in "x,y": color format
              pixels[`${x * gridSize},${y * gridSize}`] = color;
            }
          }
          
          // Create preview canvas
          const previewCanvas = document.createElement('canvas');
          previewCanvas.width = 512; // 64 * 8
          previewCanvas.height = 512; // 64 * 8
          const previewCtx = previewCanvas.getContext('2d');
          
          // Fill background
          previewCtx.fillStyle = '#000000';
          previewCtx.fillRect(0, 0, 512, 512);
          
          // Draw each pixel
          Object.entries(pixels).forEach(([key, color]) => {
            const [x, y] = key.split(',').map(Number);
            previewCtx.fillStyle = color;
            previewCtx.fillRect(x, y, gridSize, gridSize);
          });
          
          // Get preview data URL
          const pixelatedDataURL = previewCanvas.toDataURL('image/png');
          
          resolve({
            pixels,
            pixelatedDataURL
          });
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        reject(error);
      };
      
      // Load the image
      img.src = URL.createObjectURL(imageFile);
    });
  };
  
  /**
   * Applies unsharp mask to enhance edges
   * @param {ImageData} imageData - Original image data
   * @param {number} amount - Intensity of sharpening (0-2)
   * @param {number} radius - Radius of effect
   * @returns {ImageData} - Sharpened image data
   */
  function applyUnsharpMask(imageData, amount, radius) {
    const width = imageData.width;
    const height = imageData.height;
    
    // Create a copy of image data for processing
    const resultData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      width,
      height
    );
    
    // Create blurred version for unsharp mask
    const blurredData = blurImageData(imageData, radius);
    
    // Apply unsharp mask: sharpened = original + amount * (original - blurred)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        for (let c = 0; c < 3; c++) { // Only process RGB channels, not alpha
          const channel = i + c;
          const diff = imageData.data[channel] - blurredData.data[channel];
          resultData.data[channel] = Math.min(255, Math.max(0, 
            imageData.data[channel] + amount * diff
          ));
        }
      }
    }
    
    return resultData;
  }
  
  /**
   * Simple box blur implementation
   * @param {ImageData} imageData - Original image data
   * @param {number} radius - Blur radius
   * @returns {ImageData} - Blurred image data
   */
  function blurImageData(imageData, radius) {
    const width = imageData.width;
    const height = imageData.height;
    
    // Create a copy of image data for output
    const resultData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      width,
      height
    );
    
    // Apply horizontal blur
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Calculate average for each channel
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < width) {
            const ni = (y * width + nx) * 4;
            r += imageData.data[ni];
            g += imageData.data[ni + 1];
            b += imageData.data[ni + 2];
            count++;
          }
        }
        
        // Set blurred value
        resultData.data[i] = r / count;
        resultData.data[i + 1] = g / count;
        resultData.data[i + 2] = b / count;
      }
    }
    
    // Apply vertical blur using the horizontal blur result
    const tempData = new Uint8ClampedArray(resultData.data);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Calculate average for each channel
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny >= 0 && ny < height) {
            const ni = (ny * width + x) * 4;
            r += tempData[ni];
            g += tempData[ni + 1];
            b += tempData[ni + 2];
            count++;
          }
        }
        
        // Set blurred value
        resultData.data[i] = r / count;
        resultData.data[i + 1] = g / count;
        resultData.data[i + 2] = b / count;
      }
    }
    
    return resultData;
  }

  /**
   * Imports pixel data from CreatePage format to be used in the editor
   * @param {Object} pixels - The pixel data in "x,y": color format
   * @returns {Object} - The same pixel data, formatted for easy use
   */
  export const importPixelData = (pixels) => {
    return pixels; // Already in the right format
  };