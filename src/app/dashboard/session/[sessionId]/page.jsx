'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AgoraVideoSession from '@/components/AgoraVideoSession';
import { sessionService } from '@/services/apiService';

class SessionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected error occurred during the session.'
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SessionErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full text-center shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Session Interrupted</h2>
            <p className="text-sm text-gray-600 mb-4">{this.state.errorMessage}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Rejoin Session
              </button>
              <button
                onClick={() => this.props.onBack?.()}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId;
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        setLoading(true);
        const response = await sessionService.getSessionById(sessionId);
        
        // Handle wrapped response
        const sessionData = response.session || response;
        
        setSession(sessionData);
      } catch (err) {
        const msg = typeof err === 'string'
          ? err
          : (typeof err?.error === 'string' ? err.error : err?.message) || 'Failed to load session';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId]);

  const handleLeaveSession = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Session not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const teacherName = session.teacher?.name || session.Teacher?.Name || session.teacher_name || session.TeacherName || '';
  const teacherId = session.teacher_id || session.TeacherID || session.teacher?.id;

  return (
    <SessionErrorBoundary onBack={handleLeaveSession}>
      <AgoraVideoSession 
        sessionId={sessionId}
        channelName={session.channelName || session.channel_name || session.ChannelName}
        courseId={session.courseId || session.course_id || session.CourseID}
        userRole="teacher"
        teacherName={teacherName}
        teacherId={teacherId}
        onLeave={handleLeaveSession}
        sessionTitle={session.title || session.Title}
      />
    </SessionErrorBoundary>
  );
}
