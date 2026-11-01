'use client';
import { useEffect } from 'react';

/**
 * Temporary placeholder for whiteboard
 * The actual whiteboard component has been disabled due to module conflicts
 */
const InteractiveWhiteboardPlaceholder = ({ roomUUID, roomToken, isHost, onClose }) => {
  useEffect(() => {
  }, [roomUUID, roomToken, isHost]);

  return (
    <div className="flex items-center justify-center h-full bg-white p-8">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Whiteboard Feature
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          The interactive whiteboard feature is currently being configured. 
          You can still use video calls and other session features.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Close Whiteboard
        </button>
      </div>
    </div>
  );
};

export default InteractiveWhiteboardPlaceholder;
