'use client';
import { useEffect, useRef, useState } from 'react';
import { 
  Pen, 
  Square, 
  Circle, 
  Type, 
  Eraser, 
  Trash2, 
  Undo, 
  Redo,
  MousePointer,
  Image as ImageIcon,
  Minimize2,
  Maximize2
} from 'lucide-react';

const InteractiveWhiteboard = ({ 
  roomUUID, 
  roomToken, 
  isHost = false,
  onClose 
}) => {
  const whiteboardRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTool, setCurrentTool] = useState('selector');
  const [isMinimized, setIsMinimized] = useState(false);
  const [WhiteWebSdk, setWhiteWebSdk] = useState(null);
  const [isBrowser, setIsBrowser] = useState(false);

  // Check if we're in the browser
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Load SDK dynamically (client-side only)
  useEffect(() => {
    if (!isBrowser) return;
    
    const loadSDK = async () => {
      try {
        const whiteWebSdkModule = await import('white-web-sdk');
        setWhiteWebSdk(() => whiteWebSdkModule.WhiteWebSdk);
      } catch (err) {
        setError('Failed to load whiteboard');
      }
    };
    loadSDK();
  }, [isBrowser]);

  useEffect(() => {
    if (!isBrowser || !WhiteWebSdk || !roomUUID || !roomToken) return;

    let whiteboardRoom = null;

    const initWhiteboard = async () => {
      try {
        setIsLoading(true);
        
        // Initialize the SDK
        const whiteWebSdk = new WhiteWebSdk({
          appIdentifier: process.env.NEXT_PUBLIC_NETLESS_APP_ID || 'your-app-identifier',
          region: 'us-sv', // Change based on your region
          useMobXState: true,
        });

        // Join the whiteboard room
        whiteboardRoom = await whiteWebSdk.joinRoom({
          uuid: roomUUID,
          roomToken: roomToken,
          // Set writable based on user role
          isWritable: isHost,
          disableNewPencil: false,
        });

        setRoom(whiteboardRoom);

        // Bind to DOM element
        if (whiteboardRef.current) {
          whiteboardRoom.bindHtmlElement(whiteboardRef.current);
        }

        // Set default tool
        whiteboardRoom.setMemberState({
          currentApplianceName: 'selector',
          strokeColor: [0, 0, 0],
          strokeWidth: 2,
        });

        setIsLoading(false);

      } catch (err) {
        setError('Failed to connect to whiteboard');
        setIsLoading(false);
      }
    };

    initWhiteboard();

    // Cleanup
    return () => {
      if (whiteboardRoom) {
        whiteboardRoom.disconnect().catch(() => {});
      }
    };
  }, [WhiteWebSdk, roomUUID, roomToken, isHost]);

  // Tool handlers
  const handleToolChange = (tool) => {
    if (!room) return;
    
    setCurrentTool(tool);
    
    const toolMap = {
      selector: 'selector',
      pen: 'pencil',
      rectangle: 'rectangle',
      circle: 'ellipse',
      text: 'text',
      eraser: 'eraser',
    };

    room.setMemberState({
      currentApplianceName: toolMap[tool] || 'selector',
    });
  };

  const handleUndo = () => {
    if (room) {
      room.undo();
    }
  };

  const handleRedo = () => {
    if (room) {
      room.redo();
    }
  };

  const handleClear = () => {
    if (room) {
      room.cleanCurrentScene();
    }
  };

  const handleColorChange = (color) => {
    if (!room) return;
    
    const colorMap = {
      black: [0, 0, 0],
      red: [255, 0, 0],
      blue: [0, 0, 255],
      green: [0, 255, 0],
      yellow: [255, 255, 0],
    };

    room.setMemberState({
      strokeColor: colorMap[color] || [0, 0, 0],
    });
  };

  const handleStrokeWidthChange = (width) => {
    if (room) {
      room.setMemberState({
        strokeWidth: width,
      });
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 text-red-600 p-4">
        <div className="text-center">
          <p className="font-semibold mb-2">Whiteboard Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Don't render anything until we're in the browser
  if (!isBrowser) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all ${
      isMinimized ? 'h-16' : 'h-full'
    }`}>
      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-200 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Selection Tool */}
            <button
              onClick={() => handleToolChange('selector')}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                currentTool === 'selector' ? 'bg-blue-500 text-white' : ''
              }`}
              title="Select"
            >
              <MousePointer size={18} />
            </button>

            {/* Drawing Tools */}
            {isHost && (
              <>
                <button
                  onClick={() => handleToolChange('pen')}
                  className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                    currentTool === 'pen' ? 'bg-blue-500 text-white' : ''
                  }`}
                  title="Pen"
                >
                  <Pen size={18} />
                </button>

                <button
                  onClick={() => handleToolChange('rectangle')}
                  className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                    currentTool === 'rectangle' ? 'bg-blue-500 text-white' : ''
                  }`}
                  title="Rectangle"
                >
                  <Square size={18} />
                </button>

                <button
                  onClick={() => handleToolChange('circle')}
                  className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                    currentTool === 'circle' ? 'bg-blue-500 text-white' : ''
                  }`}
                  title="Circle"
                >
                  <Circle size={18} />
                </button>

                <button
                  onClick={() => handleToolChange('text')}
                  className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                    currentTool === 'text' ? 'bg-blue-500 text-white' : ''
                  }`}
                  title="Text"
                >
                  <Type size={18} />
                </button>

                <button
                  onClick={() => handleToolChange('eraser')}
                  className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                    currentTool === 'eraser' ? 'bg-blue-500 text-white' : ''
                  }`}
                  title="Eraser"
                >
                  <Eraser size={18} />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-2"></div>

                {/* Color Palette */}
                <div className="flex items-center gap-1">
                  {['black', 'red', 'blue', 'green', 'yellow'].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-6 h-6 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform`}
                      style={{ backgroundColor: color }}
                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                    />
                  ))}
                </div>

                <div className="w-px h-6 bg-gray-300 mx-2"></div>

                {/* Stroke Width */}
                <div className="flex items-center gap-1">
                  {[2, 4, 6, 8].map((width) => (
                    <button
                      key={width}
                      onClick={() => handleStrokeWidthChange(width)}
                      className="p-2 rounded hover:bg-gray-200 transition-colors"
                      title={`${width}px`}
                    >
                      <div 
                        className="bg-black rounded-full" 
                        style={{ width: width, height: width }}
                      />
                    </button>
                  ))}
                </div>

                <div className="w-px h-6 bg-gray-300 mx-2"></div>

                {/* Actions */}
                <button
                  onClick={handleUndo}
                  className="p-2 rounded hover:bg-gray-200 transition-colors"
                  title="Undo"
                >
                  <Undo size={18} />
                </button>

                <button
                  onClick={handleRedo}
                  className="p-2 rounded hover:bg-gray-200 transition-colors"
                  title="Redo"
                >
                  <Redo size={18} />
                </button>

                <button
                  onClick={handleClear}
                  className="p-2 rounded hover:bg-red-100 text-red-600 transition-colors"
                  title="Clear All"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 rounded hover:bg-gray-200 transition-colors"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Whiteboard Canvas */}
      {!isMinimized && (
        <div className="relative w-full h-full bg-white">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading whiteboard...</p>
              </div>
            </div>
          )}
          <div 
            ref={whiteboardRef} 
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        </div>
      )}
    </div>
  );
};

export default InteractiveWhiteboard;
