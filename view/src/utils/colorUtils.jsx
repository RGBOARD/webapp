export const colorUtils = {
  // Convert hex to RGB
  hexToRgb: (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  },
  
  // Convert RGB to hex
  rgbToHex: (r, g, b) => {
    return `#${r.toString(16).padStart(2, '0')}${
      g.toString(16).padStart(2, '0')}${
      b.toString(16).padStart(2, '0')}`;
  },
  
  // Convert RGB to HSV
  rgbToHsv: (r, g, b) => {
    // Normalize RGB values to [0, 1]
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const d = max - min;
    
    let h = 0;
    if (d !== 0) {
      if (max === rNorm) {
        h = ((gNorm - bNorm) / d) % 6;
      } else if (max === gNorm) {
        h = (bNorm - rNorm) / d + 2;
      } else {
        h = (rNorm - gNorm) / d + 4;
      }
    }
    
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    
    const s = max === 0 ? 0 : Math.round((d / max) * 100);
    const v = Math.round(max * 100);
    
    return { h, s, v };
  },
  
  // Convert HSV to RGB
  hsvToRgb: (h, s, v) => {
    const sNormalized = s / 100;
    const vNormalized = v / 100;
    
    const c = vNormalized * sNormalized;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = vNormalized - c;
    
    let rTemp, gTemp, bTemp;
    if (h < 60) {
      [rTemp, gTemp, bTemp] = [c, x, 0];
    } else if (h < 120) {
      [rTemp, gTemp, bTemp] = [x, c, 0];
    } else if (h < 180) {
      [rTemp, gTemp, bTemp] = [0, c, x];
    } else if (h < 240) {
      [rTemp, gTemp, bTemp] = [0, x, c];
    } else if (h < 300) {
      [rTemp, gTemp, bTemp] = [x, 0, c];
    } else {
      [rTemp, gTemp, bTemp] = [c, 0, x];
    }
    
    const r = Math.round((rTemp + m) * 255);
    const g = Math.round((gTemp + m) * 255);
    const b = Math.round((bTemp + m) * 255);
    
    return { r, g, b };
  },
  
  // Convert HSV to Hex
  hsvToHex: (h, s, v) => {
    const rgb = colorUtils.hsvToRgb(h, s, v);
    return colorUtils.rgbToHex(rgb.r, rgb.g, rgb.b);
  }
};

export default colorUtils;