'use client';
import { useEffect, useState } from 'react';

/**
 * This wrapper ensures the whiteboard only loads in the browser
 * and handles all the client-side SDK loading safely
 */
const WhiteboardWrapper = ({ roomUUID, roomToken, isHost, onClose }) => {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    let mounted = true;

    const loadComponent = async () => {
      try {
        // Use simple canvas-based whiteboard (Next.js compatible)
        const module = await import('./SimpleWhiteboard');
        if (mounted) {
          setComponent(() => module.default);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load whiteboard. Please refresh the page.');
        }
      }
    };

    loadComponent();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 text-red-600 p-4">
        <div className="text-center">
          <p className="font-semibold mb-2">Whiteboard Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  return <Component roomUUID={roomUUID} roomToken={roomToken} isHost={isHost} onClose={onClose} />;
};

export default WhiteboardWrapper;
