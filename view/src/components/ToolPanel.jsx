import { Undo, Redo, Eraser, Pencil, Pipette, PaintBucket, Plus, Minus, Ban } from 'lucide-react';
import './styles/ToolPanel.css';

function ToolPanel({ 
  selectedTool,
  handleToolSelect,
  handleUndo,
  handleRedo,
  handleClear,
  scale,
  zoomIn,
  zoomOut,
  resetZoom
}) {
  return (
    <div className="tools-column">
      <div 
        className={`tool ${selectedTool === 'pencil' ? 'selected' : ''}`}
        onClick={() => handleToolSelect('pencil')}
      >
        <Pencil/>
      </div>
      <div 
        className={`tool ${selectedTool === 'eraser' ? 'selected' : ''}`}
        onClick={() => handleToolSelect('eraser')}
      >
        <Eraser/>
      </div>
      <div 
        className={`tool ${selectedTool === 'pipette' ? 'selected' : ''}`}
        onClick={() => handleToolSelect('pipette')}
      >
        <Pipette/>
      </div>
      <div 
        className={`tool ${selectedTool === 'fill' ? 'selected' : ''}`}
        onClick={() => handleToolSelect('fill')}
      >
        <PaintBucket/>
      </div>
      <div className="zoom-controls">
        <div className="tool" onClick={zoomIn}>
          <Plus/>
        </div>
        <div className="tool" onClick={resetZoom}>
          <span>{Math.round(scale * 100)}%</span>
        </div>
        <div className="tool" onClick={zoomOut}>
          <Minus/>
        </div>
      </div>
      <div className="history-controls">
        <div className="tool" onClick={handleUndo}>
          <Undo/>
        </div>
        <div className="tool" onClick={handleRedo}>
          <Redo/>
        </div>
        <div className="tool" onClick={handleClear}>
          <Ban/>
        </div>
      </div>
    </div>
  );
}

export default ToolPanel;