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
  PenTool,
  Shield
} from 'lucide-react';
import { COLORS } from '@/theme/themeConstants';
import dynamic from 'next/dynamic';

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

// Import services
import { agoraTokenService } from '../services/agoraTokenService';
import { sessionService, courseService } from '../services/apiService';
import apiInstance from '../api/apiInstance';

const AgoraVideoSession = ({ 
  sessionId, 
  channelName, 
  courseId,
  teacherName: propTeacherName,
  teacherId: propTeacherId,
  userRole = 'teacher', // Teachers are hosts
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
  const [studentNames, setStudentNames] = useState(new Map()); // Map of UID or student ID to student name
  const [studentList, setStudentList] = useState([]);
  const [userRoles, setUserRoles] = useState(new Map()); // Map of UID to 'teacher' | 'admin' | 'student'
  const [resolvedTeacherName, setResolvedTeacherName] = useState(propTeacherName || '');
  const [resolvedTeacherId, setResolvedTeacherId] = useState(propTeacherId || null);
  
  // Refs
  const localVideoRef = useRef(null);
  const clientRef = useRef(null); // Use ref for client to avoid closure issues in event handlers
  const cameraTrackRef = useRef(null);
  const screenTrackRef = useRef(null);
  const dataStreamIdRef = useRef(null);
  const allWbStrokesRef = useRef([]);
  
  // Control states
  const [isVideoEnabled, setIsVideoEnabled] = useState(true); // Auto-enabled on join
  const [isAudioEnabled, setIsAudioEnabled] = useState(true); // Auto-enabled on join
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [volume, setVolume] = useState(50);
  const [videoReady, setVideoReady] = useState(false);
  
  // Whiteboard states
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [whiteboardRoomUUID, setWhiteboardRoomUUID] = useState(null);
  const [whiteboardToken, setWhiteboardToken] = useState(null);
  const [loadingWhiteboard, setLoadingWhiteboard] = useState(false);
  const showWhiteboardRef = useRef(false);
  const whiteboardRoomUUIDRef = useRef(null);
  showWhiteboardRef.current = showWhiteboard;
  whiteboardRoomUUIDRef.current = whiteboardRoomUUID;
  
  // Force video playback on user interaction
  const forceVideoPlayback = async () => {
    if (localVideoRef.current && localVideoTrack) {
      try {
        const videoElement = localVideoRef.current;
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.playsInline = true;

        await Promise.resolve(localVideoTrack.play(videoElement));
        setVideoReady(true);
      } catch (error) {}
    }
  };
  
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
            
            await Promise.resolve(localVideoTrack.play(videoElement));
            setVideoReady(true);
          }
        } catch (error) {}
      };
      
      const timer = setTimeout(attemptPlayback, 500);
      return () => clearTimeout(timer);
    }
  }, [localVideoTrack, videoReady]);

  // Ensure video element is ready when component mounts
  useEffect(() => {
    if (localVideoRef.current && isJoined && localVideoTrack) {
      try {
        const videoElement = localVideoRef.current;
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.playsInline = true;

        Promise.resolve(localVideoTrack.play(videoElement))
          .then(() => {
            setVideoReady(true);
          })
          .catch(() => {
            setTimeout(() => {
              try {
                if (localVideoRef.current && localVideoTrack) {
                  Promise.resolve(localVideoTrack.play(localVideoRef.current)).catch(() => {});
                }
              } catch (e) {}
            }, 1000);
          });
      } catch (error) {}
    }
  }, [isJoined, localVideoTrack]);

  // Fetch session attendees/students for name mapping
  useEffect(() => {
    const fetchSessionStudents = async () => {
      try {
        let students = [];
        let resolvedCourseId = courseId;
        
        // 1. Resolve session details, teacher, and courseId if not provided
        try {
          const session = await sessionService.getSessionById(sessionId);
          const sessionData = session?.session || session;
          if (!resolvedCourseId) {
            resolvedCourseId = sessionData?.courseId || sessionData?.course_id || sessionData?.CourseID;
          }
          const tName = sessionData?.teacher?.name || sessionData?.Teacher?.Name || sessionData?.teacher_name || sessionData?.TeacherName;
          if (tName) setResolvedTeacherName(tName);
          const tId = sessionData?.teacher_id || sessionData?.TeacherID || sessionData?.teacher?.id;
          if (tId) setResolvedTeacherId(tId);
        } catch (sessionError) {
          console.warn('Error fetching session details:', sessionError);
        }

        // 2. Fetch enrolled students for this course
        if (resolvedCourseId) {
          try {
            const courseStudents = await courseService.getCourseStudents(resolvedCourseId);
            students = Array.isArray(courseStudents) ? courseStudents : (courseStudents?.students || []);
          } catch (courseError) {
            console.warn('Error fetching course students:', courseError);
          }
        }

        // 3. Fallback: try session attendees if course students list is empty
        if (!students || students.length === 0) {
          try {
            const attendees = await sessionService.getSessionAttendees(sessionId);
            students = Array.isArray(attendees) ? attendees : (attendees?.students || attendees?.attendees || []);
          } catch (attendeeError) {
            console.warn('Error fetching session attendees:', attendeeError);
          }
        }
        
        // 4. Map student names by ID (numeric and string) and by index
        if (students && students.length > 0) {
          setStudentList(students);
          setStudentNames(prev => {
            const namesMap = new Map(prev);
            students.forEach((student, index) => {
              const displayName = student.name || student.Name || student.first_name || student.FirstName || student.email || `Student #${index + 1}`;
              namesMap.set(index, displayName);
              const sid = student.id || student.ID || student.student_id || student.StudentID;
              if (sid) {
                namesMap.set(sid, displayName);
                namesMap.set(Number(sid), displayName);
                namesMap.set(String(sid), displayName);
              }
            });
            return namesMap;
          });
        }
      } catch (error) {
        console.warn('Could not fetch students for session:', error);
      }
    };

    if (sessionId) {
      fetchSessionStudents();
    }
  }, [sessionId, courseId]);

  // Handle page reload/navigation to cleanup Agora session
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
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
      } catch (error) {}
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
    
    return () => {
      isMounted = false;
      const cleanup = async () => {
        try {
          if (localVideoTrack) {
            localVideoTrack.close();
          }
          if (localAudioTrack) {
            localAudioTrack.close();
          }
          if (clientRef.current) {
            await clientRef.current.leave();
            clientRef.current.removeAllListeners();
            clientRef.current = null;
          }
        } catch (error) {}
      };
      cleanup();
    };
  }, []);

  const initializeAgoraSession = async (AgoraRTC) => {
    if (!AgoraRTC) return;

    try {
      setIsLoading(true);
      setError(null);

      const effectiveAppId = (typeof agoraTokenService.getAppId === 'function' 
        ? await agoraTokenService.getAppId() 
        : null) || process.env.NEXT_PUBLIC_AGORA_APP_ID;
      if (!effectiveAppId || effectiveAppId === 'your_agora_app_id_here') {
        throw new Error('Agora App ID is not configured. Please set NEXT_PUBLIC_AGORA_APP_ID.');
      }

      const effectiveChannelName = channelName || `session_${sessionId}`;
      const token = await agoraTokenService.generateToken(effectiveChannelName, userRole);
      const uid = Math.floor(Math.random() * 1000000);

      let agoraClient;
      try {
        agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      } catch (clientError) {
        agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
      }

      // Set up event listeners
      agoraClient.on('user-published', handleUserPublished);
      agoraClient.on('user-unpublished', handleUserUnpublished);
      agoraClient.on('user-joined', handleUserJoined);
      agoraClient.on('user-left', handleUserLeft);
      agoraClient.on('stream-message', (senderUid, data) => {
        try {
          const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
          const info = JSON.parse(text);

          // Role discovery query from peer: answer with teacher role
          if (info?.type === 'discover_roles' || info?.type === 'role_query') {
            broadcastStreamMsg({
              type: 'user_role',
              role: 'teacher',
              uid: uid,
              name: propTeacherName || resolvedTeacherName || 'Instructor',
              teacherId: propTeacherId || resolvedTeacherId
            });
          }

          // User role declaration
          if (info?.type === 'user_role') {
            if (info.uid && info.role) {
              setUserRoles(prev => {
                const next = new Map(prev);
                next.set(info.uid, info.role);
                next.set(Number(info.uid), info.role);
                next.set(String(info.uid), info.role);
                return next;
              });
              if (info.name) {
                setStudentNames(prev => {
                  const next = new Map(prev);
                  next.set(info.uid, info.name);
                  next.set(Number(info.uid), info.name);
                  next.set(String(info.uid), info.name);
                  return next;
                });
              }
            }
          }

          // Student profile broadcast
          if (info?.type === 'student_info') {
            setUserRoles(prev => {
              const next = new Map(prev);
              next.set(senderUid, 'student');
              next.set(Number(senderUid), 'student');
              next.set(String(senderUid), 'student');
              if (info.uid) {
                next.set(info.uid, 'student');
                next.set(Number(info.uid), 'student');
              }
              return next;
            });
          }

          // Whiteboard sync request from student
          if (info?.type === 'wb' && info?.a === 'req') {
            if (showWhiteboardRef.current) {
              broadcastStreamMsg({ type: 'wb', a: 'v', show: true, room: whiteboardRoomUUIDRef.current });
              if (allWbStrokesRef.current.length > 0) {
                const strokes = allWbStrokesRef.current;
                for (let i = 0; i < strokes.length; i += 15) {
                  const batch = strokes.slice(i, i + 15);
                  broadcastStreamMsg({ type: 'wb', a: 'sync', strokes: batch });
                }
              }
            }
          }

          const name = info?.name || info?.studentName;
          if (name) {
            setStudentNames(prev => {
              const next = new Map(prev);
              next.set(senderUid, name);
              next.set(Number(senderUid), name);
              next.set(String(senderUid), name);
              if (info.uid) {
                next.set(info.uid, name);
                next.set(Number(info.uid), name);
                next.set(String(info.uid), name);
              }
              if (info.studentId) {
                next.set(info.studentId, name);
                next.set(Number(info.studentId), name);
                next.set(String(info.studentId), name);
              }
              return next;
            });
          }
        } catch (e) {
          console.warn('Error decoding stream message in teacher:', e);
        }
      });

      setClient(agoraClient);
      clientRef.current = agoraClient;

      await agoraClient.join(effectiveAppId, effectiveChannelName, token, uid);
      setIsJoined(true);

      await createAndPublishTracks(agoraClient);

      // Broadcast Teacher role to the channel and query other participants
      const broadcastTeacherRole = async () => {
        try {
          const current = clientRef.current;
          if (!current) return;
          const payload = JSON.stringify({
            type: 'user_role',
            role: 'teacher',
            uid: uid,
            name: propTeacherName || resolvedTeacherName || 'Instructor',
            teacherId: propTeacherId || resolvedTeacherId
          });
          await current.sendStreamMessage(payload);
          await current.sendStreamMessage(JSON.stringify({ type: 'role_query' }));
        } catch (e) {
          console.warn('Failed to broadcast teacher role:', e);
        }
      };

      broadcastTeacherRole();
      setTimeout(broadcastTeacherRole, 1500);
      setTimeout(broadcastTeacherRole, 4000);

    } catch (err) {
      if (err.code === 'CAN_NOT_GET_GATEWAY_SERVER' || err.message?.includes('dynamic use static key')) {
        setError(`🔧 Authentication Setup Required: Agora Certificate disabled in Console.`);
      } else if (err.code === 'INVALID_APP_ID') {
        setError('Invalid App ID. Please check your NEXT_PUBLIC_AGORA_APP_ID environment variable.');
      } else {
        setError(`Connection failed: ${err.message || 'Unknown error'}.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createAndPublishTracks = async (agoraClient) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera/microphone access.');
      }

      const AgoraRTCModule = await import('agora-rtc-sdk-ng');
      const AgoraRTC = AgoraRTCModule.default;

      let videoTrack = null;
      let audioTrack = null;

      try {
        [videoTrack, audioTrack] = await Promise.all([
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
      } catch (bothErr) {
        // Fallback: try audio and video separately so one missing device doesn't block the other
        try {
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack({ encoderConfig: "music_standard" });
        } catch (aErr) {
          console.warn('Microphone access failed:', aErr);
        }
        try {
          videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: { width: 640, height: 480, frameRate: 15, bitrateMin: 400, bitrateMax: 1000 }
          });
        } catch (vErr) {
          console.warn('Camera access failed:', vErr);
        }
        if (!audioTrack && !videoTrack) {
          throw bothErr;
        }
      }

      cameraTrackRef.current = videoTrack;
      setLocalVideoTrack(videoTrack);
      setLocalAudioTrack(audioTrack);
      setIsVideoEnabled(Boolean(videoTrack));
      setIsAudioEnabled(Boolean(audioTrack));

      const tracksToPublish = [videoTrack, audioTrack].filter(Boolean);
      if (tracksToPublish.length > 0) {
        await agoraClient.publish(tracksToPublish);
      }
    } catch (error) {
      setError(error?.message || 'Failed to access camera or microphone.');
    }
  };

  // Event handlers
  const handleUserPublished = async (user, mediaType) => {
    try {
      const currentClient = clientRef.current;
      if (!currentClient) return;
      
      await currentClient.subscribe(user, mediaType);
      
      setRemoteUsers(prev => {
        const newMap = new Map(prev);
        const existingUser = newMap.get(user.uid) || { uid: user.uid, hasVideo: false, hasAudio: false };
        
        if (mediaType === 'video') {
          existingUser.videoTrack = user.videoTrack;
          existingUser.hasVideo = true;
        } else if (mediaType === 'audio') {
          existingUser.audioTrack = user.audioTrack;
          existingUser.hasAudio = true;
          try {
            user.audioTrack?.play();
          } catch (audioErr) {
            console.warn('Audio play failed:', audioErr);
          }
        }
        
        newMap.set(user.uid, existingUser);
        return newMap;
      });

      if (mediaType === 'video' && user.videoTrack) {
        setTimeout(() => {
          try {
            const container = document.getElementById(`remote-video-${user.uid}`);
            if (container && user.videoTrack) {
              container.innerHTML = '';
              user.videoTrack.play(container);
            }
          } catch (videoErr) {
            console.warn('Remote video play failed:', videoErr);
          }
        }, 150);
      }
    } catch (error) {}
  };

  const handleUserUnpublished = (user, mediaType) => {
    setRemoteUsers(prev => {
      const newMap = new Map(prev);
      const existingUser = newMap.get(user.uid);
      if (existingUser) {
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
    setRemoteUsers(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(user.uid)) {
        newMap.set(user.uid, { uid: user.uid, hasVideo: false, hasAudio: false });
      }
      return newMap;
    });

    // Query new user's role
    broadcastStreamMsg({ type: 'role_query' });
  };

  const handleUserLeft = (user) => {
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
    try {
      if (localVideoTrack) {
        if (isVideoEnabled) {
          await localVideoTrack.setEnabled(false);
          setIsVideoEnabled(false);
        } else {
          await localVideoTrack.setEnabled(true);
          setIsVideoEnabled(true);
        }
      }
    } catch (err) {
      console.warn('Failed to toggle video:', err);
    }
  };

  const toggleAudio = async () => {
    try {
      if (localAudioTrack) {
        if (isAudioEnabled) {
          await localAudioTrack.setEnabled(false);
          setIsAudioEnabled(false);
        } else {
          await localAudioTrack.setEnabled(true);
          setIsAudioEnabled(true);
        }
      }
    } catch (err) {
      console.warn('Failed to toggle audio:', err);
    }
  };

  const startScreenShare = async () => {
    try {
      const AgoraRTCModule = await import('agora-rtc-sdk-ng');
      const AgoraRTC = AgoraRTCModule.default;
      
      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: "1080p_1",
      });
      
      const currentClient = clientRef.current;
      if (!currentClient) return;
      
      // Keep camera track alive (just unpublish + disable) so stopping screen share doesn't re-prompt permission
      const camTrack = cameraTrackRef.current || localVideoTrack;
      if (camTrack) {
        await currentClient.unpublish(camTrack);
        await camTrack.setEnabled(false);
      }
      
      await currentClient.publish(screenTrack);
      screenTrackRef.current = screenTrack;
      
      if (localVideoRef.current) {
        screenTrack.play(localVideoRef.current);
      }
      
      setLocalVideoTrack(screenTrack);
      setIsScreenSharing(true);
      setIsVideoEnabled(true);
      
      screenTrack.on('track-ended', () => {
        stopScreenShare();
      });
    } catch (error) {
      setIsScreenSharing(false);
      alert('Failed to start screen sharing. Please try again.');
    }
  };

  const stopScreenShare = async () => {
    try {
      const currentClient = clientRef.current;
      if (!currentClient) return;
      
      const activeScreenTrack = screenTrackRef.current || (isScreenSharing ? localVideoTrack : null);
      if (activeScreenTrack) {
        await currentClient.unpublish(activeScreenTrack);
        activeScreenTrack.close();
        screenTrackRef.current = null;
      }
      
      let camTrack = cameraTrackRef.current;
      if (!camTrack) {
        const AgoraRTCModule = await import('agora-rtc-sdk-ng');
        const AgoraRTC = AgoraRTCModule.default;
        camTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: {
            width: 640,
            height: 480,
            frameRate: 15,
            bitrateMin: 400,
            bitrateMax: 1000,
          }
        });
        cameraTrackRef.current = camTrack;
      } else {
        await camTrack.setEnabled(true);
      }
      
      await currentClient.publish(camTrack);
      
      setLocalVideoTrack(camTrack);
      setIsScreenSharing(false);
      setIsVideoEnabled(true);
      
      if (localVideoRef.current) {
        try {
          await Promise.resolve(camTrack.play(localVideoRef.current));
        } catch (playError) {}
      }
    } catch (error) {
      setIsScreenSharing(false);
      alert('Failed to stop screen sharing. Please refresh the page.');
    }
  };

  const broadcastStreamMsg = async (msgObj) => {
    try {
      const current = clientRef.current;
      if (!current) return;
      const payload = JSON.stringify(msgObj);
      await current.sendStreamMessage(payload);
    } catch (err) {
      console.warn('Failed to broadcast stream message:', err);
    }
  };

  // Whiteboard functions
  const toggleWhiteboard = async () => {
    if (showWhiteboard) {
      setShowWhiteboard(false);
      broadcastStreamMsg({ type: 'wb', a: 'v', show: false });
    } else {
      await fetchWhiteboardToken();
    }
  };

  const fetchWhiteboardToken = async () => {
    try {
      setLoadingWhiteboard(true);
      
      let room = `session-${sessionId}`;
      let token = 'mock-token';
      try {
        const response = await apiInstance.get('/teacher/whiteboard-token', {
          params: { sessionId, role: 'teacher' }
        });
        if (response?.data?.roomUUID) {
          room = response.data.roomUUID;
          token = response.data.roomToken || 'token';
        }
      } catch (apiErr) {
        try {
          const fetchRes = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/whiteboard-token?sessionId=${sessionId}&role=teacher`,
            { credentials: 'include' }
          );
          if (fetchRes.ok) {
            const data = await fetchRes.json();
            if (data?.roomUUID) {
              room = data.roomUUID;
              token = data.roomToken || 'token';
            }
          }
        } catch (fetchErr) {
          console.warn('Whiteboard backend token fetch failed, falling back to session room:', apiErr);
        }
      }

      setWhiteboardRoomUUID(room);
      setWhiteboardToken(token);
      setShowWhiteboard(true);
      setLoadingWhiteboard(false);
      broadcastStreamMsg({ type: 'wb', a: 'v', show: true, room: room });

      if (allWbStrokesRef.current.length > 0) {
        const strokes = allWbStrokesRef.current;
        for (let i = 0; i < strokes.length; i += 20) {
          const batch = strokes.slice(i, i + 20);
          broadcastStreamMsg({ type: 'wb', a: 'sync', strokes: batch });
        }
      }
    } catch (error) {
      console.error('Error opening whiteboard:', error);
      setLoadingWhiteboard(false);
    }
  };

  const handleWhiteboardStroke = (stroke) => {
    if (allWbStrokesRef.current.length > 3500) {
      allWbStrokesRef.current.shift();
    }
    allWbStrokesRef.current.push(stroke);

    if (stroke.a === 's') {
      broadcastStreamMsg({ type: 'wb', a: 'v', show: true, room: whiteboardRoomUUIDRef.current });
    }
    broadcastStreamMsg({ type: 'wb', ...stroke });
  };

  const handleWhiteboardClear = () => {
    allWbStrokesRef.current = [];
    broadcastStreamMsg({ type: 'wb', a: 'c' });
  };

  // Student Remote Control Functions
  const handleToggleStudentAudio = async (targetUid, hasAudio) => {
    try {
      const action = hasAudio ? 'mute_audio' : 'unmute_audio';
      await broadcastStreamMsg({
        type: 'teacher_control',
        action,
        targetUid: targetUid
      });

      if (hasAudio) {
        setRemoteUsers(prev => {
          const next = new Map(prev);
          const user = next.get(targetUid) || next.get(Number(targetUid)) || next.get(String(targetUid));
          if (user) {
            user.hasAudio = false;
            if (user.audioTrack) {
              try { user.audioTrack.stop(); } catch (e) {}
            }
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to toggle student audio:', err);
    }
  };

  const handleToggleStudentVideo = async (targetUid, hasVideo) => {
    try {
      const action = hasVideo ? 'mute_video' : 'unmute_video';
      await broadcastStreamMsg({
        type: 'teacher_control',
        action,
        targetUid: targetUid
      });

      if (hasVideo) {
        setRemoteUsers(prev => {
          const next = new Map(prev);
          const user = next.get(targetUid) || next.get(Number(targetUid)) || next.get(String(targetUid));
          if (user) {
            user.hasVideo = false;
            if (user.videoTrack) {
              try { user.videoTrack.stop(); } catch (e) {}
            }
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to toggle student video:', err);
    }
  };

  const handleMuteAllStudents = async () => {
    try {
      await broadcastStreamMsg({
        type: 'teacher_control',
        action: 'mute_all_audio'
      });

      setRemoteUsers(prev => {
        const next = new Map(prev);
        next.forEach(user => {
          user.hasAudio = false;
          if (user.audioTrack) {
            try { user.audioTrack.stop(); } catch (e) {}
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to mute all students:', err);
    }
  };

  const leaveSession = async () => {
    try {
      if (sessionId) {
        try {
          await sessionService.updateSession(sessionId, { status: 'completed' });
        } catch (e) {
          console.warn('Could not auto-mark session as completed:', e);
        }
      }

      if (cameraTrackRef.current) {
        try { cameraTrackRef.current.close(); } catch (e) {}
        cameraTrackRef.current = null;
      }
      if (screenTrackRef.current) {
        try { screenTrackRef.current.close(); } catch (e) {}
        screenTrackRef.current = null;
      }
      if (localVideoTrack) {
        try { localVideoTrack.close(); } catch (e) {}
      }
      if (localAudioTrack) {
        try { localAudioTrack.close(); } catch (e) {}
      }
      if (client) {
        await client.leave();
      }
      
      setIsJoined(false);
      setRemoteUsers(new Map());
      clientRef.current = null;
      
      if (onLeave) {
        onLeave();
      }
    } catch (error) {}
  };

  // Determine role of each remote user
  const getRoleForUser = (user) => {
    const uid = user.uid;
    const recorded = userRoles.get(uid) || userRoles.get(Number(uid)) || userRoles.get(String(uid));
    if (recorded) return recorded;
    return 'student';
  };

  // Partition remote users: Admins vs Students (Admin is NEVER counted as student)
  const remoteUsersArray = Array.from(remoteUsers.values());
  const remoteAdmins = remoteUsersArray.filter(u => getRoleForUser(u) === 'admin');
  const remoteStudents = remoteUsersArray.filter(u => getRoleForUser(u) !== 'admin');

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
              <PhoneOff className="text-red-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-6 text-sm">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Retry
              </button>
              <button
                onClick={leaveSession}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="bg-white shadow-md px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {sessionTitle || 'Live Video Session'}
          </h1>
          <p className="text-sm text-gray-500">
            Channel: {channelName || `session_${sessionId}`}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Users size={16} />
              {remoteUsers.size + 1} participants
            </span>
            <span className="text-green-600 font-medium">
              • {remoteStudents.length} {remoteStudents.length === 1 ? 'student' : 'students'} connected
            </span>
            {remoteAdmins.length > 0 && (
              <span className="text-purple-600 font-medium flex items-center gap-1">
                <Shield size={14} className="text-purple-500" />
                Admin observing
              </span>
            )}
            {isScreenSharing && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">
                Screen Sharing Active
              </span>
            )}
          </div>
          
          <button
            onClick={leaveSession}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
          >
            <PhoneOff size={16} />
            End Session
          </button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main Video Area (Teacher's Local Video / Stage) */}
        <div className="flex-1 relative bg-black overflow-hidden">
          {/* Whiteboard Overlay */}
          {showWhiteboard && (
            <div className="absolute inset-0 z-20 bg-white">
              <WhiteboardWrapper
                roomUUID={whiteboardRoomUUID || `session-${sessionId}`}
                roomToken={whiteboardToken || 'token'}
                isHost={true}
                onClose={toggleWhiteboard}
                onStroke={handleWhiteboardStroke}
                onClear={handleWhiteboardClear}
                initialStrokes={allWbStrokesRef.current}
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
              playsInline
              autoPlay
              controls={false}
              onClick={forceVideoPlayback}
            />
            
            {/* Camera off overlay */}
            {!isVideoEnabled && (
              <div 
                className="absolute inset-0 flex items-center justify-center text-white bg-gray-800 cursor-pointer"
                onClick={forceVideoPlayback}
              >
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={48} className="text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">Your Camera is Off</p>
                  <p className="text-sm text-gray-400 mb-4">Click "Start Video" below to turn on your camera</p>
                  {localVideoTrack && (
                    <button
                      onClick={forceVideoPlayback}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded transition-colors"
                    >
                      Troubleshoot Video
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Teacher Badge */}
            <div className="absolute top-6 left-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm">
              <span className="font-semibold text-sm">Instructor (Host)</span>
            </div>

            {/* Teacher Media Status Icons */}
            <div className="absolute bottom-6 left-6 flex items-center gap-2">
              <div className={`p-2.5 rounded-xl backdrop-blur-md ${
                isAudioEnabled ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
              }`}>
                {isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </div>
              <div className={`p-2.5 rounded-xl backdrop-blur-md ${
                isVideoEnabled ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
              }`}>
                {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Student Participants */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col p-4 flex-shrink-0">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Users size={20} className="text-blue-400" />
                Participants
              </h3>
              <div className="flex items-center gap-2">
                {remoteStudents.length > 0 && (
                  <button
                    onClick={handleMuteAllStudents}
                    className="text-xs bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                    title="Mute all students"
                  >
                    <VolumeX size={13} />
                    <span>Mute All</span>
                  </button>
                )}
                <div className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  {remoteUsers.size}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">Classroom Participants</p>
          </div>

          {/* Admin Observer Tile (if Admin is in session) */}
          {remoteAdmins.length > 0 && (
            <div className="mb-4 space-y-2">
              {remoteAdmins.map(admin => (
                <div key={admin.uid} className="bg-purple-900/40 border border-purple-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs text-purple-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-[10px]">
                      A
                    </div>
                    <span className="font-semibold">Administrator (Observer)</span>
                  </div>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                    ID: {String(admin.uid).slice(-4)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Students List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs uppercase tracking-wider text-blue-300 font-bold">
                Students ({remoteStudents.length})
              </h4>
            </div>

            {remoteStudents.length === 0 ? (
              <div className="text-gray-400 text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-gray-500" />
                </div>
                <p className="text-sm font-medium mb-1">No students yet</p>
                <p className="text-xs text-gray-500">Waiting for students to join...</p>
              </div>
            ) : (
              remoteStudents.map((user, studentIdx) => {
                const rawName = 
                  studentNames.get(user.uid) || 
                  studentNames.get(Number(user.uid)) || 
                  studentNames.get(String(user.uid)) || 
                  (studentList[studentIdx] ? (studentList[studentIdx].name || studentList[studentIdx].Name) : null) || 
                  studentNames.get(studentIdx) || 
                  `Student #${studentIdx + 1}`;
                const studentName = typeof rawName === 'string' ? rawName : String(rawName || `Student #${studentIdx + 1}`);

                const initials = studentName
                  .replace(/[^a-zA-Z0-9 ]/g, '')
                  .trim()
                  .split(' ')
                  .filter(Boolean)
                  .map(w => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || `S${studentIdx + 1}`;

                return (
                <div 
                  key={user.uid} 
                  className="bg-gray-700 rounded-xl overflow-hidden hover:bg-gray-600 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="w-full h-48 bg-gray-900 relative">
                    <div 
                      id={`remote-video-${user.uid}`}
                      className="w-full h-full bg-gray-900"
                      style={{ position: 'relative' }}
                    />
                    
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
                    
                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-bold z-10">
                      #{studentIdx + 1}
                    </div>
                    
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black bg-opacity-60 px-2 py-1 rounded-lg z-10">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-white">Live</span>
                    </div>
                  </div>
                  
                  {/* Student Info */}
                  <div className="p-3 bg-gradient-to-r from-gray-700 to-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-semibold flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 min-w-[32px] bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase">
                          {initials}
                        </div>
                        <span className="truncate max-w-[170px]" title={studentName}>{studentName}</span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">ID: {String(user.uid).slice(-4)}</span>
                    </div>
                    
                    {/* Media Controls for Teacher */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleToggleStudentAudio(user.uid, user.hasAudio)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer shadow-sm active:scale-95 ${
                          user.hasAudio 
                            ? 'bg-red-500/20 text-red-300 hover:bg-red-600 hover:text-white border border-red-500/40' 
                            : 'bg-green-500/20 text-green-300 hover:bg-green-600 hover:text-white border border-green-500/40'
                        }`}
                        title={user.hasAudio ? `Click to mute ${studentName}'s microphone` : `Click to unmute ${studentName}'s microphone`}
                      >
                        {user.hasAudio ? (
                          <>
                            <Mic size={14} className="text-green-400" />
                            <span>Mute Mic</span>
                          </>
                        ) : (
                          <>
                            <MicOff size={14} className="text-red-400" />
                            <span>Unmute Mic</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleToggleStudentVideo(user.uid, user.hasVideo)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer shadow-sm active:scale-95 ${
                          user.hasVideo 
                            ? 'bg-red-500/20 text-red-300 hover:bg-red-600 hover:text-white border border-red-500/40' 
                            : 'bg-green-500/20 text-green-300 hover:bg-green-600 hover:text-white border border-green-500/40'
                        }`}
                        title={user.hasVideo ? `Click to turn off ${studentName}'s camera` : `Click to turn on ${studentName}'s camera`}
                      >
                        {user.hasVideo ? (
                          <>
                            <Video size={14} className="text-green-400" />
                            <span>Turn Off Cam</span>
                          </>
                        ) : (
                          <>
                            <VideoOff size={14} className="text-gray-300" />
                            <span>Turn On Cam</span>
                          </>
                        )}
                      </button>
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
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="text-sm">{sessionTitle || 'Live Session'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
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

            <button
              onClick={leaveSession}
              className="group relative flex items-center gap-2 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              <PhoneOff size={20} />
              <span>End Session</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-white">
            <Users size={18} className="text-blue-400" />
            <span className="text-sm font-semibold">{remoteStudents.length} Students</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgoraVideoSession;
