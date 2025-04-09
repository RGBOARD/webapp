import ColorPalette from './ColorPalette';
import './styles/ColorPickerPanel.css';

function ColorPickerPanel({
  selectedColor,
  hexColor,
  rgbValues,
  hsvValues,
  handleColorChange,
  handleRGBChange,
  handleHSVChange,
  colorSliderRef,
  handleSave,
  handleFileNameChange,
  fileName
}) {
  return (
    <div className="color-picker-column">
      <div className="color-preview" style={{ backgroundColor: selectedColor }}></div>
      <div className="color-slider-container">
        <div className="color-slider" ref={colorSliderRef}></div>
      </div>
      
      <div className="color-values">
        <div className="hex-value">
          <label>Hex</label>
          <input
            type="text"
            value={hexColor}
            onChange={(e) => handleColorChange(e.target.value)}
            maxLength={hexColor.startsWith('#') ? 7 : 6}
          />
        </div>
        
        <div className="rgb-values">
          <div className="rgb-value">
            <label>R</label>
            <input 
              type="text" 
              value={rgbValues.r} 
              onChange={(e) => handleRGBChange('r', e.target.value)}
            />
          </div>
          <div className="rgb-value">
            <label>G</label>
            <input 
              type="text" 
              value={rgbValues.g} 
              onChange={(e) => handleRGBChange('g', e.target.value)}
            />
          </div>
          <div className="rgb-value">
            <label>B</label>
            <input 
              type="text" 
              value={rgbValues.b} 
              onChange={(e) => handleRGBChange('b', e.target.value)}
            />
          </div>
        </div>
        
        <div className="hsv-values">
          <div className="hsv-value">
            <label>H</label>
            <input 
              type="text" 
              value={hsvValues.h} 
              onChange={(e) => handleHSVChange('h', e.target.value)}
            />
          </div>
          <div className="hsv-value">
            <label>S</label>
            <input 
              type="text" 
              value={hsvValues.s} 
              onChange={(e) => handleHSVChange('s', e.target.value)}
            />
          </div>
          <div className="hsv-value">
            <label>V</label>
            <input 
              type="text" 
              value={hsvValues.v} 
              onChange={(e) => handleHSVChange('v', e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <ColorPalette handleColorChange={handleColorChange} />
      
      <div className="action-buttons">
        <div className="hex-value">
            <label>File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => handleFileNameChange(e.target.value)}
            />
        </div>
        <button className="save-button" onClick={handleSave}>Save Design</button>
      </div>
    </div>
  );
}

export default ColorPickerPanel;