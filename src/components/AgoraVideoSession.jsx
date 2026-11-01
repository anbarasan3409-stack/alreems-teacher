import { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Monitor, 
  Users, 
  Settings,
  MessageSquare,
  Volume2,
  VolumeX,
  Clock,
  PenTool
} from 'lucide-react';
import { COLORS } from '@/theme/themeConstants';
import dynamic from 'next/dynamic';

// Import Agora RTC SDK dynamically to avoid SSR issues
const AgoraRTC = dynamic(
  () => import('agora-rtc-sdk-ng').then(mod => mod.default),
  { ssr: false }
);

// Import Whiteboard wrapper with complete client-side isolation
const WhiteboardWrapper = dynamic(
  () => import('./WhiteboardWrapper'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    )
  }
);

// Import token service
import { agoraTokenService } from '../services/agoraTokenService';
import { sessionService } from '../services/apiService';

const AgoraVideoSession = ({ 
  sessionId, 
  channelName, 
  userRole = 'host', // Teachers are typically hosts
  onLeave,
  sessionTitle
}) => {
  // State management
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState(new Map());
  const [studentNames, setStudentNames] = useState(new Map()); // Map of UID to student name
  
  // Refs
  const localVideoRef = useRef(null);
  const clientRef = useRef(null); // Use ref for client to avoid closure issues in event handlers
  
  // Control states
  const [isVideoEnabled, setIsVideoEnabled] = useState(false); // Default OFF
  const [isAudioEnabled, setIsAudioEnabled] = useState(false); // Default OFF
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [volume, setVolume] = useState(50);
  const [videoReady, setVideoReady] = useState(false);
  
  // Whiteboard states
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [whiteboardRoomUUID, setWhiteboardRoomUUID] = useState(null);
  const [whiteboardToken, setWhiteboardToken] = useState(null);
  const [loadingWhiteboard, setLoadingWhiteboard] = useState(false);
  
  // Force video playback on user interaction
  const forceVideoPlayback = async () => {
    if (localVideoRef.current && localVideoTrack) {
      try {
        // Ensure video element is properly configured
        const videoElement = localVideoRef.current;
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.playsInline = true;

        const playPromise = localVideoTrack.play(videoElement);

        playPromise.then(() => {
          setVideoReady(true);
        }).catch((error) => {
          // Playback failed
        });

      } catch (error) {
        // Error in force video playback
      }
    }
  };
  
    // Separate effect to handle video element mounting
  useEffect(() => {
    if (localVideoRef.current) {
    }
  }, [localVideoRef.current]);
  
  // Fallback: try to play video whenever both element and track are available
  useEffect(() => {
    if (localVideoRef.current && localVideoTrack && !videoReady) {
      
      const attemptPlayback = async () => {
        try {
          const videoElement = localVideoRef.current;
          if (videoElement) {
            videoElement.muted = true;
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            
            await localVideoTrack.play(videoElement);
            setVideoReady(true);
          }
        } catch (error) {
        }
      };
      
      // Small delay to ensure DOM is fully ready
      setTimeout(attemptPlayback, 500);
    }
  }, [localVideoRef.current, localVideoTrack, videoReady]);

  // Ensure video element is ready when component mounts
  useEffect(() => {
    if (localVideoRef.current && isJoined && localVideoTrack) {
      try {
        // Ensure video element is properly configured
        const videoElement = localVideoRef.current;
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.playsInline = true;

        // Always try to play, regardless of paused state
        const playPromise = localVideoTrack.play(videoElement);

        playPromise.then(() => {
          setVideoReady(true);
        }).catch((playError) => {
          // Try again after a delay
          setTimeout(() => {
            if (localVideoRef.current && localVideoTrack) {
              localVideoTrack.play(localVideoRef.current).catch(() => {
                // Retry failed
              });
            }
          }, 1000);
        });

      } catch (error) {
        // Error ensuring video playback
      }
    }
  }, [isJoined, localVideoTrack]);  // Agora configuration
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;

  // Fetch session attendees/students for name mapping
  useEffect(() => {
    const fetchSessionStudents = async () => {
      try {
        // First, try to get session attendees
        let students = [];
        
        try {
          const attendees = await sessionService.getSessionAttendees(sessionId);
          students = Array.isArray(attendees) ? attendees : (attendees.students || attendees.attendees || []);
        } catch (attendeeError) {
          
          // Fallback: Get session details and then course students
          try {
            const session = await sessionService.getSessionById(sessionId);
            const sessionData = session.session || session;
            
            if (sessionData.course_id || sessionData.CourseID) {
              const courseId = sessionData.course_id || sessionData.CourseID;
              const { sessionService: _, courseService } = await import('../services/apiService');
              const courseStudents = await courseService.getCourseStudents(courseId);
              students = Array.isArray(courseStudents) ? courseStudents : (courseStudents.students || []);
            }
          } catch (sessionError) {
          }
        }
        
        // Create a map of student names
        if (students.length > 0) {
          const namesMap = new Map();
          students.forEach((student, index) => {
            const displayName = student.name || student.Name || student.first_name || student.FirstName || `Student #${index + 1}`;
            namesMap.set(index, displayName);
          });
          setStudentNames(namesMap);
        }
      } catch (error) {
        // Not critical, will fall back to generic names
      }
    };

    if (sessionId) {
      fetchSessionStudents();
    }
  }, [sessionId]);

  // Handle page reload/navigation to cleanup Agora session
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      
      // Synchronous cleanup for beforeunload
      try {
        if (localVideoTrack) {
          localVideoTrack.close();
        }
        if (localAudioTrack) {
          localAudioTrack.close();
        }
        if (clientRef.current) {
          clientRef.current.leave();
          clientRef.current.removeAllListeners();
        }
      } catch (error) {
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [localVideoTrack, localAudioTrack]);

  // Initialize Agora SDK
  useEffect(() => {
    let isMounted = true;
    
    const initializeAgora = async () => {
      try {
        const AgoraRTCModule = await import('agora-rtc-sdk-ng');
        const AgoraRTC = AgoraRTCModule.default;
        
        if (!isMounted) return;
        
        await initializeAgoraSession(AgoraRTC);
      } catch (error) {
        if (isMounted) {
          setError('Failed to load video SDK. Please refresh and try again.');
          setIsLoading(false);
        }
      }
    };

    initializeAgora();
    
    // Cleanup function when component unmounts
    return () => {
      isMounted = false;
      
      // Clean up Agora resources
      const cleanup = async () => {
        try {
          
          // Close local tracks
          if (localVideoTrack) {
            localVideoTrack.close();
          }
          if (localAudioTrack) {
            localAudioTrack.close();
          }
          
          // Leave channel and clean up client
          if (clientRef.current) {
            await clientRef.current.leave();
            clientRef.current.removeAllListeners();
            clientRef.current = null;
          }
          
        } catch (error) {
        }
      };
      
      cleanup();
    };
  }, []);

  const initializeAgoraSession = async (AgoraRTC) => {
    if (!AgoraRTC) return;

    try {
      setIsLoading(true);
      setError(null);

      // Generate token for the channel
      const token = await agoraTokenService.generateToken(channelName, userRole);
      
      // Generate a random UID for this teacher session
      const uid = Math.floor(Math.random() * 1000000);

      // Create Agora client with different modes to handle certificate issues
      let agoraClient;
      try {
        // Try with default settings first
        agoraClient = AgoraRTC.createClient({ 
          mode: 'rtc', 
          codec: 'vp8' 
        });
      } catch (clientError) {
        // Fallback to h264 codec
        agoraClient = AgoraRTC.createClient({ 
          mode: 'rtc', 
          codec: 'h264' 
        });
      }

      // Set up event listeners
      agoraClient.on('user-published', handleUserPublished);
      agoraClient.on('user-unpublished', handleUserUnpublished);
      agoraClient.on('user-joined', handleUserJoined);
      agoraClient.on('user-left', handleUserLeft);

      setClient(agoraClient);
      clientRef.current = agoraClient; // Also set the ref for event handlers

      // Join channel as host
      await agoraClient.join(appId, channelName, token, uid);
      setIsJoined(true);

      // Create and publish local tracks for the teacher (host) immediately
      await createAndPublishTracks(agoraClient);

    } catch (err) {
      // More specific error handling with user guidance
      if (err.code === 'CAN_NOT_GET_GATEWAY_SERVER' || err.message?.includes('dynamic use static key')) {
        setError(`🔧 Authentication Setup Required:

1. Go to console.agora.io
2. Login and select your project
3. Go to "Config" → "App Certificate" 
4. DISABLE App Certificate for development
5. Save and wait 1-2 minutes
6. Refresh this page and try again

Your App ID (${appId}) is configured correctly. The issue is that App Certificate is enabled but no token server is running.`);
      } else if (err.code === 'INVALID_APP_ID') {
        setError('Invalid App ID. Please check your NEXT_PUBLIC_AGORA_APP_ID environment variable.');
      } else if (err.code === 'INVALID_CHANNEL_NAME') {
        setError('Invalid channel name. Please contact support.');
      } else {
        setError(`Connection failed: ${err.message || 'Unknown error'}. Please check your internet connection and try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createAndPublishTracks = async (agoraClient) => {
    try {
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera/microphone access. Please use a modern browser like Chrome, Firefox, or Safari.');
      }

      // Request permissions first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        
        if (permError.name === 'NotAllowedError') {
          throw new Error(`🎥 Camera/Microphone Access Denied

Please follow these steps:
1. Click the camera/microphone icon in your browser's address bar
2. Select "Allow" for camera and microphone
3. Refresh this page and try again

Or in browser settings:
• Chrome: Settings → Privacy → Site Settings → Camera/Microphone
• Safari: Preferences → Websites → Camera/Microphone
• Firefox: Preferences → Privacy → Permissions`);
        } else if (permError.name === 'NotFoundError') {
          throw new Error('No camera or microphone found. Please connect a camera/microphone and try again.');
        } else if (permError.name === 'NotReadableError') {
          throw new Error('Camera or microphone is being used by another application. Please close other apps and try again.');
        } else {
          throw new Error(`Camera/Microphone error: ${permError.message}`);
        }
      }

      // Import AgoraRTC for track creation
      const AgoraRTCModule = await import('agora-rtc-sdk-ng');
      const AgoraRTC = AgoraRTCModule.default;

      
      // Create camera and microphone tracks
      const [videoTrack, audioTrack] = await Promise.all([
        AgoraRTC.createCameraVideoTrack({
          encoderConfig: {
            width: 640,
            height: 480,
            frameRate: 15,
            bitrateMin: 400,
            bitrateMax: 1000,
          }
        }),
        AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: "music_standard",
        })
      ]);

      setLocalVideoTrack(videoTrack);
      setLocalAudioTrack(audioTrack);

      
      // Publish tracks to the channel (must be enabled when publishing)
      await agoraClient.publish([videoTrack, audioTrack]);

      // Now disable tracks after publishing (teacher starts with mic and camera off)
      await videoTrack.setEnabled(false);
      await audioTrack.setEnabled(false);

      // Note: Video playback will be handled by the useEffect when the component renders

    } catch (error) {
      setError(error.message || 'Failed to access camera or microphone. Please check permissions and try again.');
    }
  };

  // Event handlers
  const handleUserPublished = async (user, mediaType) => {
    
    try {
      // Use clientRef to avoid null reference
      const currentClient = clientRef.current;
      if (!currentClient) {
        return;
      }
      
      // Subscribe to the user
      await currentClient.subscribe(user, mediaType);
      
      
      // Update remote users state immediately
      setRemoteUsers(prev => {
        const newMap = new Map(prev);
        const existingUser = newMap.get(user.uid) || { uid: user.uid, hasVideo: false, hasAudio: false };
        
        if (mediaType === 'video') {
          existingUser.videoTrack = user.videoTrack;
          existingUser.hasVideo = true;
        } else if (mediaType === 'audio') {
          existingUser.audioTrack = user.audioTrack;
          existingUser.hasAudio = true;
        }
        
        newMap.set(user.uid, existingUser);
        return newMap;
      });

      // Play remote media
      if (mediaType === 'video' && user.videoTrack) {
        // Use a longer timeout to ensure DOM is ready
        setTimeout(() => {
          const videoContainer = document.getElementById(`remote-video-${user.uid}`);
          if (videoContainer) {
            user.videoTrack.play(videoContainer);
          } else {
            // Retry after another short delay
            setTimeout(() => {
              const retryContainer = document.getElementById(`remote-video-${user.uid}`);
              if (retryContainer) {
                user.videoTrack.play(retryContainer);
              }
            }, 500);
          }
        }, 200);
      }
      
      if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.play();
      }
    } catch (error) {
    }
  };

  const handleUserUnpublished = (user, mediaType) => {
    
    // Update remote users state to trigger re-render but keep the user
    setRemoteUsers(prev => {
      const newMap = new Map(prev);
      if (newMap.has(user.uid)) {
        const existingUser = newMap.get(user.uid);
        // Remove the specific track but keep the user
        if (mediaType === 'video') {
          existingUser.videoTrack = null;
          existingUser.hasVideo = false;
        } else if (mediaType === 'audio') {
          existingUser.audioTrack = null;
          existingUser.hasAudio = false;
        }
        newMap.set(user.uid, existingUser);
      }
      return newMap;
    });
  };

  const handleUserJoined = (user) => {
    
    // Add user to remote users even if they haven't published yet
    setRemoteUsers(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(user.uid)) {
        newMap.set(user.uid, { 
          uid: user.uid, 
          hasVideo: false, 
          hasAudio: false 
        });
      }
      return newMap;
    });
  };

  const handleUserLeft = (user) => {
    
    // Remove immediately - no delay needed with proper cleanup
    setRemoteUsers(prev => {
      const newMap = new Map(prev);
      if (newMap.has(user.uid)) {
        newMap.delete(user.uid);
      }
      return newMap;
    });
  };

  // Control functions
  const toggleVideo = async () => {
    if (localVideoTrack) {
      if (isVideoEnabled) {
        await localVideoTrack.setEnabled(false);
        setIsVideoEnabled(false);
      } else {
        await localVideoTrack.setEnabled(true);
        setIsVideoEnabled(true);
      }
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      if (isAudioEnabled) {
        await localAudioTrack.setEnabled(false);
        setIsAudioEnabled(false);
      } else {
        await localAudioTrack.setEnabled(true);
        setIsAudioEnabled(true);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      
      // Import AgoraRTC dynamically
      const AgoraRTCModule = await import('agora-rtc-sdk-ng');
      const AgoraRTC = AgoraRTCModule.default;
      
      // Create screen share track
      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: "1080p_1", // High quality for screen sharing
      });
      
      const currentClient = clientRef.current;
      if (!currentClient) {
        return;
      }
      
      // Unpublish current video track
      if (localVideoTrack) {
        await currentClient.unpublish(localVideoTrack);
        localVideoTrack.close();
      }
      
      // Publish screen share track
      await currentClient.publish(screenTrack);
      
      // Play screen share locally
      if (localVideoRef.current) {
        screenTrack.play(localVideoRef.current);
      }
      
      setLocalVideoTrack(screenTrack);
      setIsScreenSharing(true);
      setIsVideoEnabled(true); // Screen share counts as video enabled
      
      // Listen for user stopping screen share from browser
      screenTrack.on('track-ended', () => {
        stopScreenShare();
      });
      
      
    } catch (error) {
      
      // Handle user cancellation
      if (error.message?.includes('Permission denied') || error.message?.includes('NotAllowedError')) {
      } else {
        alert('Failed to start screen sharing. Please try again.');
      }
    }
  };

  const stopScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        return;
      }
      
      const currentClient = clientRef.current;
      if (!currentClient) {
        return;
      }
      
      // Import AgoraRTC dynamically
      const AgoraRTCModule = await import('agora-rtc-sdk-ng');
      const AgoraRTC = AgoraRTCModule.default;
      
      // Unpublish and close screen share track
      if (localVideoTrack) {
        try {
          await currentClient.unpublish([localVideoTrack]);
        } catch (unpublishError) {
        }
        
        localVideoTrack.close();
      }
      
      // Create new camera track
      const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: {
          width: 640,
          height: 480,
          frameRate: 15,
          bitrateMin: 400,
          bitrateMax: 1000,
        }
      });
      
      // Publish camera track first, then disable it
      await currentClient.publish([newVideoTrack]);
      
      // Disable camera by default
      await newVideoTrack.setEnabled(false);
      
      // Update state before playing
      setLocalVideoTrack(newVideoTrack);
      setIsScreenSharing(false);
      setIsVideoEnabled(false);
      
      // Play camera locally
      if (localVideoRef.current) {
        try {
          await newVideoTrack.play(localVideoRef.current);
        } catch (playError) {
        }
      }
      
      
    } catch (error) {
      
      // Reset state even if there's an error
      setIsScreenSharing(false);
      
      alert('Failed to stop screen sharing. Please refresh the page.');
    }
  };

  // Whiteboard functions
  const toggleWhiteboard = async () => {
    if (showWhiteboard) {
      setShowWhiteboard(false);
    } else {
      await fetchWhiteboardToken();
    }
  };

  const fetchWhiteboardToken = async () => {
    try {
      setLoadingWhiteboard(true);
      
      // Fetch whiteboard token from backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/whiteboard-token?sessionId=${sessionId}&role=admin`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to get whiteboard credentials';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, get text
          const errorText = await response.text();
          errorMessage = `Server error (${response.status}): ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      setWhiteboardRoomUUID(data.roomUUID);
      setWhiteboardToken(data.roomToken);
      setShowWhiteboard(true);
      setLoadingWhiteboard(false);
    } catch (error) {
      alert(`Failed to load whiteboard: ${error.message}`);
      setLoadingWhiteboard(false);
    }
  };

  const leaveSession = async () => {
    try {
      // Clean up local tracks
      if (localVideoTrack) {
        localVideoTrack.close();
      }
      if (localAudioTrack) {
        localAudioTrack.close();
      }
      
      // Leave channel
      if (client) {
        await client.leave();
      }
      
      // Reset state and ref
      setIsJoined(false);
      setRemoteUsers(new Map());
      clientRef.current = null;
      
      // Call parent callback
      if (onLeave) {
        onLeave();
      }
      
    } catch (error) {
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Joining Session...</h3>
            <p className="text-gray-600">Setting up your video conference</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneOff size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-red-600">Connection Failed</h3>
            <div className="text-gray-600 text-sm whitespace-pre-line mb-6">
              {error}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={onLeave}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main video session UI
  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-md px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold" style={{ color: COLORS.primary }}>
            {sessionTitle || 'Teaching Session'}
          </h1>
          <p className="text-sm text-gray-600">Channel: {channelName}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={16} />
            <span>{remoteUsers.size + 1} participants</span>
            {remoteUsers.size > 0 && (
              <span className="text-green-600">• {remoteUsers.size} students connected</span>
            )}
          </div>
          
          <button
            onClick={leaveSession}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <PhoneOff size={16} />
            End Session
          </button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 relative bg-black overflow-hidden">
          {/* Whiteboard Overlay */}
          {showWhiteboard && whiteboardRoomUUID && whiteboardToken && (
            <div className="absolute inset-0 z-20 bg-white">
              <WhiteboardWrapper
                roomUUID={whiteboardRoomUUID}
                roomToken={whiteboardToken}
                isHost={userRole === 'host'}
                onClose={() => setShowWhiteboard(false)}
              />
            </div>
          )}

          {/* Local Video (Teacher) */}
          <div className="w-full h-full relative bg-gray-900">
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover cursor-pointer"
              style={{ 
                background: isVideoEnabled ? 'transparent' : '#374151',
                display: isVideoEnabled ? 'block' : 'none',
                visibility: 'visible'
              }}
              muted
              autoPlay
              playsInline
              onLoadedData={() => {
                setVideoReady(true);
              }}
              onClick={forceVideoPlayback}
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-white text-center">
                  <VideoOff size={48} className="mx-auto mb-2" />
                  <p>Camera is off</p>
                </div>
              </div>
            )}
            {isVideoEnabled && !videoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Click to start video</p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video Label */}
          <div className="absolute top-6 left-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-semibold">You (Teacher)</span>
            </div>
            {isScreenSharing && (
              <span className="text-xs text-green-300 flex items-center gap-1 mt-1">
                <Monitor size={12} />
                Screen Sharing
              </span>
            )}
          </div>
          
          {/* Session Info - Top Right */}
          <div className="absolute top-6 right-6 bg-black bg-opacity-60 text-white px-4 py-2 rounded-xl backdrop-blur-sm">
            <div className="text-xs text-gray-300">Session ID</div>
            <div className="font-mono text-sm font-semibold">{sessionId}</div>
          </div>
        </div>

        {/* Students Panel - Enhanced */}
        <div className="w-96 bg-gradient-to-b from-gray-800 to-gray-900 p-6 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Users size={20} className="text-blue-400" />
                Participants
              </h3>
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {remoteUsers.size}
              </div>
            </div>
            <p className="text-xs text-gray-400">Students in this session</p>
          </div>

          {/* Students List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {remoteUsers.size === 0 ? (
              <div className="text-gray-400 text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-gray-500" />
                </div>
                <p className="text-sm font-medium mb-1">No students yet</p>
                <p className="text-xs text-gray-500">Waiting for students to join...</p>
              </div>
            ) : (
              Array.from(remoteUsers.values()).map((user, index) => {
                // Get student name from the fetched names map, or use generic name
                const studentName = studentNames.get(index) || `Student #${index + 1}`;
                
                return (
                <div 
                  key={user.uid} 
                  className="bg-gray-700 rounded-xl overflow-hidden hover:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="w-full h-48 bg-gray-900 relative">
                    {/* Video Container - Always present for Agora to render into */}
                    <div 
                      id={`remote-video-${user.uid}`}
                      className="w-full h-full bg-gray-900"
                      style={{ position: 'relative' }}
                    />
                    
                    {/* Camera off overlay - only shows when no video */}
                    {!user.hasVideo && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-800">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Users size={32} className="text-gray-500" />
                          </div>
                          <p className="text-xs">Camera off</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Student number badge */}
                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-bold z-10">
                      #{index + 1}
                    </div>
                    
                    {/* Connection indicator */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black bg-opacity-60 px-2 py-1 rounded-lg z-10">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-white">Live</span>
                    </div>
                  </div>
                  
                  {/* Student Info */}
                  <div className="p-3 bg-gradient-to-r from-gray-700 to-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-semibold flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                          S{index + 1}
                        </div>
                        <span>{studentName}</span>
                      </p>
                      <span className="text-xs text-gray-400">ID: {String(user.uid).slice(-4)}</span>
                    </div>
                    
                    {/* Media Status */}
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                        user.hasAudio ? 'bg-green-500 bg-opacity-20' : 'bg-red-500 bg-opacity-20'
                      }`}>
                        {user.hasAudio ? (
                          <Mic size={14} className="text-green-400" />
                        ) : (
                          <MicOff size={14} className="text-red-400" />
                        )}
                        <span className={`text-xs font-medium ${
                          user.hasAudio ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {user.hasAudio ? 'Audio' : 'Muted'}
                        </span>
                      </div>
                      
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                        user.hasVideo ? 'bg-green-500 bg-opacity-20' : 'bg-gray-600'
                      }`}>
                        {user.hasVideo ? (
                          <Video size={14} className="text-green-400" />
                        ) : (
                          <VideoOff size={14} className="text-gray-400" />
                        )}
                        <span className={`text-xs font-medium ${
                          user.hasVideo ? 'text-green-300' : 'text-gray-400'
                        }`}>
                          {user.hasVideo ? 'Video' : 'Off'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
              })
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Controls Bar */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-5 border-t border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Left: Session Info */}
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="text-sm">{sessionTitle || 'Live Session'}</span>
            </div>
          </div>
          
          {/* Center: Main Controls */}
          <div className="flex items-center gap-3">
            {/* Audio Control */}
            <button
              onClick={toggleAudio}
              className={`group relative p-4 rounded-xl transition-all duration-200 ${
                isAudioEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isAudioEnabled ? (
                <Mic size={22} className="text-white" />
              ) : (
                <MicOff size={22} className="text-white" />
              )}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isAudioEnabled ? 'Mute' : 'Unmute'}
              </div>
            </button>

            {/* Video Control */}
            <button
              onClick={toggleVideo}
              className={`group relative p-4 rounded-xl transition-all duration-200 ${
                isVideoEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? (
                <Video size={22} className="text-white" />
              ) : (
                <VideoOff size={22} className="text-white" />
              )}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isVideoEnabled ? 'Stop video' : 'Start video'}
              </div>
            </button>

            {/* Screen Share Control */}
            <button
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className={`group relative p-4 rounded-xl transition-all duration-200 ${
                isScreenSharing 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            >
              <Monitor size={22} className="text-white" />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isScreenSharing ? 'Stop sharing' : 'Share screen'}
              </div>
            </button>

            {/* Whiteboard Control */}
            <button
              onClick={toggleWhiteboard}
              disabled={loadingWhiteboard}
              className={`group relative p-4 rounded-xl transition-all duration-200 ${
                showWhiteboard 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              } ${loadingWhiteboard ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={showWhiteboard ? 'Hide whiteboard' : 'Show whiteboard'}
            >
              {loadingWhiteboard ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <PenTool size={22} className="text-white" />
              )}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {showWhiteboard ? 'Hide whiteboard' : 'Show whiteboard'}
              </div>
            </button>

            {/* End Session */}
            <button
              onClick={leaveSession}
              className="group relative flex items-center gap-2 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              <PhoneOff size={20} />
              <span>End Session</span>
            </button>
          </div>
          
          {/* Right: Participants Count */}
          <div className="flex items-center gap-2 text-white">
            <Users size={18} className="text-blue-400" />
            <span className="text-sm font-semibold">{remoteUsers.size} Students</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgoraVideoSession;
