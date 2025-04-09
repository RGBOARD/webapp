import './styles/ColorPalette.css';

function ColorPalette({ handleColorChange }) {
  // Predefined color palette
  const paletteColors = [
    ['#000000', '#FFFFFF', '#808080', '#C0C0C0', '#800000', '#FF0000'],
    ['#FF00FF', '#FFC0CB', '#FFA500', '#FFFF00', '#808000', '#00FF00'],
    ['#008000', '#00FFFF', '#008080', '#0000FF', '#000080', '#800080']
  ];

  return (
    <div className="color-palette">
      {paletteColors.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="palette-row">
          {row.map((color, colorIndex) => (
            <div 
              key={`color-${rowIndex}-${colorIndex}`}
              className="palette-color" 
              style={{ backgroundColor: color }} 
              onClick={() => handleColorChange(color)}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default ColorPalette;