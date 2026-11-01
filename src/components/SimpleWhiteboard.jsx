'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Pen,
  Eraser,
  Square,
  Circle,
  Type,
  Trash2,
  Download,
  MousePointer,
} from 'lucide-react';

/**
 * Simple Canvas-based Interactive Whiteboard
 * Compatible with Next.js without external dependencies
 */
const SimpleWhiteboard = ({ roomUUID, roomToken, isHost, onClose }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setContext(ctx);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const startDrawing = (e) => {
    if (!context || currentTool === 'select') return;
    
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || !context) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'pen') {
      context.strokeStyle = currentColor;
      context.lineWidth = lineWidth;
      context.globalCompositeOperation = 'source-over';
      context.lineTo(x, y);
      context.stroke();
    } else if (currentTool === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = lineWidth * 3;
      context.lineTo(x, y);
      context.stroke();
    }
  };

  const stopDrawing = () => {
    if (!context) return;
    setIsDrawing(false);
    context.closePath();
  };

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const downloadCanvas = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const colors = [
    '#000000', // Black
    '#FF0000', // Red
    '#0000FF', // Blue
    '#00FF00', // Green
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-100 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">Interactive Whiteboard</h3>
          <span className="text-xs text-gray-500">
            Room: {roomUUID.substring(0, 8)}...
          </span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Close
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1 border-r pr-2">
          <button
            onClick={() => setCurrentTool('select')}
            className={`p-2 rounded transition ${
              currentTool === 'select'
                ? 'bg-blue-500 text-white'
                : 'bg-white hover:bg-gray-200'
            }`}
            title="Select"
          >
            <MousePointer size={18} />
          </button>
          
          <button
            onClick={() => setCurrentTool('pen')}
            className={`p-2 rounded transition ${
              currentTool === 'pen'
                ? 'bg-blue-500 text-white'
                : 'bg-white hover:bg-gray-200'
            }`}
            title="Pen"
            disabled={!isHost}
          >
            <Pen size={18} />
          </button>

          <button
            onClick={() => setCurrentTool('eraser')}
            className={`p-2 rounded transition ${
              currentTool === 'eraser'
                ? 'bg-blue-500 text-white'
                : 'bg-white hover:bg-gray-200'
            }`}
            title="Eraser"
            disabled={!isHost}
          >
            <Eraser size={18} />
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1 border-r pr-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={`w-6 h-6 rounded border-2 transition ${
                currentColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
              disabled={!isHost}
            />
          ))}
        </div>

        {/* Line Width */}
        <div className="flex items-center gap-2 border-r pr-2">
          <label className="text-xs text-gray-600">Size:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-20"
            disabled={!isHost}
          />
          <span className="text-xs text-gray-600 w-6">{lineWidth}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={clearCanvas}
            className="p-2 rounded bg-white hover:bg-gray-200 transition"
            title="Clear Canvas"
            disabled={!isHost}
          >
            <Trash2 size={18} />
          </button>

          <button
            onClick={downloadCanvas}
            className="p-2 rounded bg-white hover:bg-gray-200 transition"
            title="Download"
          >
            <Download size={18} />
          </button>
        </div>

        {!isHost && (
          <div className="ml-auto">
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              View Only
            </span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className={`w-full h-full ${
            currentTool === 'select' ? 'cursor-default' : 'cursor-crosshair'
          }`}
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Footer */}
      <div className="p-2 bg-gray-50 border-t text-xs text-gray-500 text-center">
        {isHost ? 'You can draw and edit' : 'View-only mode'}
      </div>
    </div>
  );
};

export default SimpleWhiteboard;
