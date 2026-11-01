import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Calendar, Clock, Users, Video, Plus, ChevronRight, Download, ExternalLink, BookOpen, TrendingUp, CheckCircle, X, Zap } from 'lucide-react';
import { COLORS } from '@/theme/themeConstants';
import { teacherService, sessionService } from '@/services/apiService';
import AttendanceModal from '@/components/AttendanceModal';

export default function MySessions() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedAttendanceSession, setSelectedAttendanceSession] = useState(null);
  const [showInstantSessionModal, setShowInstantSessionModal] = useState(false);
  const [instantSessionData, setInstantSessionData] = useState({
    title: '',
    course: '',
    duration: '60',
    description: ''
  });

  // State for courses
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // State for sessions
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const statsCards = [];

  // Fetch teacher's courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const coursesData = await teacherService.getTeacherCourses();
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (error) {
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch teacher's sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const sessionsData = await sessionService.getTeacherSessions();
      
      // Handle both direct array and wrapped response
      const allSessions = Array.isArray(sessionsData) 
        ? sessionsData 
        : Array.isArray(sessionsData?.sessions) 
          ? sessionsData.sessions 
          : [];
      
      setSessions(allSessions);

      // Separate sessions into upcoming and past
      const now = new Date();
      const upcoming = [];
      const past = [];

      allSessions.forEach(session => {
        const sessionStartTime = new Date(session.start_time || session.StartTime);
        const sessionStatus = (session.status || session.Status || '').toLowerCase();
        
        // Session is upcoming if it's active/scheduled and hasn't ended yet
        if (sessionStatus === 'active' || sessionStatus === 'scheduled') {
          upcoming.push(session);
        } else if (sessionStatus === 'completed' || sessionStatus === 'cancelled') {
          past.push(session);
        } else {
          // Fallback: check by time if status is unclear
          const sessionEndTime = new Date(session.end_time || session.EndTime);
          if (sessionEndTime >= now) {
            upcoming.push(session);
          } else {
            past.push(session);
          }
        }
      });


      setUpcomingSessions(upcoming);
      setPastSessions(past);
    } catch (error) {
      setSessions([]);
      setUpcomingSessions([]);
      setPastSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleStartInstantSession = () => {
    setShowInstantSessionModal(true);
  };

  const handleCloseModal = () => {
    setShowInstantSessionModal(false);
    setInstantSessionData({
      title: '',
      course: '',
      duration: '60',
      description: ''
    });
  };

  const handleInstantSessionSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create session data in the format expected by the backend
      const now = new Date();
      const endTime = new Date(now.getTime() + parseInt(instantSessionData.duration) * 60000);
      
      const sessionData = {
        title: instantSessionData.title,
        course_id: parseInt(instantSessionData.course),
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        duration: parseInt(instantSessionData.duration),
        description: instantSessionData.description || '',
        status: 'active' // Mark as active for instant session
      };

      
      const response = await sessionService.createSession(sessionData);
      
      // Close modal
      handleCloseModal();
      
      // Refresh sessions list
      await fetchSessions();
      
      // Show success message
      alert('Session created successfully!');
      
    } catch (error) {
      alert('Failed to create session: ' + (error.error || error.message || 'Unknown error'));
    }
  };

  const handleInputChange = (field, value) => {
    setInstantSessionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleJoinSession = (sessionId) => {
    // Navigate to the session page
    router.push(`/dashboard/session/${sessionId}`);
  };

  const handleStartSession = async (sessionId) => {
    try {
      
      // Update session status to 'active'
      const response = await sessionService.updateSession(sessionId, {
        status: 'active'
      });
      
      
      // Refresh sessions list
      await fetchSessions();
      
      // Navigate to the session
      router.push(`/dashboard/session/${sessionId}`);
    } catch (error) {
      alert('Failed to start session: ' + (error.error || error.message || 'Unknown error'));
    }
  };

  const handleDownloadRecording = (recordingUrl) => {
    // Handle recording download
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.primary }}>My Sessions</h1>
        <p className="text-gray-600">Manage your teaching sessions and recordings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon size={24} style={{ color: stat.color }} />
                </div>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded-full ${
                    stat.changeType === 'positive' ? 'bg-green-100 text-green-700' :
                    stat.changeType === 'negative' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold mb-1" style={{ color: COLORS.text }}>{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upcoming Sessions
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'past'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Past Sessions
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStartInstantSession}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors hover:shadow-lg"
              style={{
                backgroundColor: COLORS.secondary,
                color: COLORS.background
              }}
            >
              <Zap size={20} />
              Start Instant Session
            </button>

            <button
              onClick={() => toast.info('Schedule a Session feature coming soon!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              })}
              className="flex items-center gap-2 px-6 py-3 border-2 rounded-lg font-medium transition-colors hover:shadow-lg"
              style={{
                borderColor: COLORS.primary,
                color: COLORS.primary,
                backgroundColor: 'transparent'
              }}
            >
              <Calendar size={20} />
              Schedule a Session
            </button>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {loadingSessions ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sessions...</p>
          </div>
        </div>
      ) : activeTab === 'upcoming' ? (
        <div className="space-y-6">
          <div className="grid gap-4">
            {upcomingSessions.map((session) => (
              <div key={session.ID || session.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${COLORS.secondary}15` }}>
                        <Calendar size={24} style={{ color: COLORS.secondary }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold mb-1" style={{ color: COLORS.text }}>
                          {session.Title || session.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {session.course_name || session.Course?.Name || session.course?.name || 'No course'}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{formatDate(session.start_time || session.StartTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>
                              {new Date(session.start_time || session.StartTime).toLocaleTimeString()} 
                              ({session.duration || session.Duration} min)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={16} />
                            <span>{session.max_students || session.MaxStudents || 30} max students</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    {(session.status || session.Status) === 'active' ? (
                      <>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                          Live Now
                        </span>
                        <button
                          onClick={() => handleJoinSession(session.id || session.ID)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:shadow-md"
                          style={{
                            backgroundColor: COLORS.primary,
                            color: COLORS.background
                          }}
                        >
                          Join Session
                          <ChevronRight size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status || session.Status)}`}>
                          {session.status || session.Status}
                        </span>
                        <button
                          onClick={() => handleStartSession(session.id || session.ID)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:shadow-md border-2"
                          style={{
                            borderColor: COLORS.primary,
                            color: COLORS.primary,
                            backgroundColor: 'transparent'
                          }}
                        >
                          <Play size={16} />
                          Start Session
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {upcomingSessions.length === 0 && !loadingSessions && (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No upcoming sessions</h3>
              <p className="text-gray-500">You don't have any scheduled sessions at the moment.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4">
            {pastSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="relative group cursor-pointer">
                        <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                          <Video size={20} className="text-gray-500" />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={16} className="text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold mb-1" style={{ color: COLORS.text }}>{session.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{session.course}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{formatDate(session.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>{session.time} ({session.duration})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={16} />
                            <span>{session.students} students</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedAttendanceSession(session)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-secondary hover:bg-secondary/5 transition-colors"
                      >
                        <Users size={14} />
                        Attendance
                      </button>
                      <button
                        onClick={() => window.open(session.recording, '_blank')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-secondary hover:bg-secondary/5 transition-colors"
                      >
                        <ExternalLink size={14} />
                        Watch
                      </button>

                      <button
                        onClick={() => handleDownloadRecording(session.recording)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-secondary hover:bg-secondary/5 transition-colors"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pastSessions.length === 0 && (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
              <Video size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No past sessions</h3>
              <p className="text-gray-500">Your recorded sessions will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Instant Session Modal */}
      {showInstantSessionModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${COLORS.secondary}15` }}
                  >
                    <Zap size={20} style={{ color: COLORS.secondary }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: COLORS.primary }}>Start Instant Session</h2>
                    <p className="text-sm text-gray-600">Create and start a session immediately</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleInstantSessionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.text }}>
                    Session Title *
                  </label>
                  <input
                    type="text"
                    value={instantSessionData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Quick Math Review"
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.text }}>
                    Course *
                  </label>
                  <select
                    value={instantSessionData.course}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                    required
                    disabled={loadingCourses}
                  >
                    <option value="">
                      {loadingCourses ? 'Loading courses...' : courses.length === 0 ? 'No courses available' : 'Select a course'}
                    </option>
                    {courses.map((course) => (
                      <option key={course.ID || course.id} value={course.ID || course.id}>
                        {course.Name || course.name} ({course.Code || course.code})
                      </option>
                    ))}
                  </select>
                  {courses.length === 0 && !loadingCourses && (
                    <p className="text-xs text-gray-500 mt-1">
                      You need to be assigned to a course first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.text }}>
                    Duration (minutes) *
                  </label>
                  <select
                    value={instantSessionData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.text }}>
                    Description (Optional)
                  </label>
                  <textarea
                    value={instantSessionData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the session topic..."
                    rows={3}
                    className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: COLORS.secondary,
                      color: COLORS.background
                    }}
                  >
                    Start Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {selectedAttendanceSession && (
        <AttendanceModal 
          session={selectedAttendanceSession} 
          onClose={() => setSelectedAttendanceSession(null)} 
        />
      )}
    </div>
  );
}
