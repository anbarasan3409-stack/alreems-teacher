import { BookOpen, TrendingUp, Clock, CheckCircle, AlertCircle, FileText, Users, Calendar } from 'lucide-react';
import { COLORS } from '@/theme/themeConstants';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { courseService, teacherService, sessionService } from '@/services/apiService';

export default function DashboardContent() {
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSessions: 0,
    completedSessions: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const { user, isAuthenticated } = useAuth();

  // Fetch teacher's courses when authenticated
  useEffect(() => {
    const fetchTeacherCourses = async () => {
      if (!isAuthenticated) {
        setCoursesLoading(false);
        return;
      }

      try {
        setCoursesLoading(true);
        setStatsLoading(true);
        setCoursesError(null);
        
        // Fetch courses, students, and sessions concurrently
        const [coursesData, studentsData, sessionsData] = await Promise.all([
          courseService.getTeacherCourses(),
          teacherService.getAllStudents(),
          sessionService.getTeacherSessions()
        ]);
        
        if (coursesData && Array.isArray(coursesData)) {
          const transformedCourses = coursesData.map(course => ({
            id: course.ID,
            name: course.Name,
            progress: course.progress || Math.floor(Math.random() * 100),
            students: course.enrollmentCount || 0,
            nextSession: course.next_session || 'No upcoming session',
            status: course.status || 'active'
          }));
          setCourses(transformedCourses);
        } else {
          setCourses([]);
        }

        // Calculate stats
        const totalStudents = Array.isArray(studentsData) ? studentsData.length : 0;
        const sessions = Array.isArray(sessionsData) ? sessionsData : [];
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.status === 'completed').length;
        
        setStats({
          totalStudents,
          totalSessions,
          completedSessions
        });

      } catch (error) {
        setCoursesError('Failed to load courses');
        setCourses([]);
      } finally {
        setCoursesLoading(false);
        setStatsLoading(false);
      }
    };

    fetchTeacherCourses();
  }, [isAuthenticated]);
  const statsCards = [
    {
      title: 'Total Students',
      value: statsLoading ? '...' : stats.totalStudents.toString(),
      icon: Users,
      color: COLORS.secondary,
      change: 'Current',
      changeType: 'neutral'
    },
    {
      title: 'Active Courses',
      value: coursesLoading ? '...' : courses.length.toString(),
      icon: BookOpen,
      color: COLORS.primary,
      change: courses.length > 0 ? 'Active' : 'None',
      changeType: courses.length > 0 ? 'positive' : 'neutral'
    },
    {
      title: 'Total Sessions',
      value: statsLoading ? '...' : stats.totalSessions.toString(),
      icon: Calendar,
      color: '#FF9800',
      change: 'Scheduled & Live',
      changeType: 'neutral'
    },
    {
      title: 'Completed Sessions',
      value: statsLoading ? '...' : stats.completedSessions.toString(),
      icon: CheckCircle,
      color: '#4CAF50',
      change: 'Done',
      changeType: 'positive'
    }
  ];

  const recentActivities = [
    {
      type: 'assignment',
      message: 'New assignment submitted by John Doe',
      time: '2 hours ago',
      icon: FileText
    },
    {
      type: 'session',
      message: 'Mathematics session completed',
      time: '4 hours ago',
      icon: CheckCircle
    },
    {
      type: 'student',
      message: 'Sarah joined Physics Fundamentals',
      time: '1 day ago',
      icon: Users
    },
    {
      type: 'reminder',
      message: 'Chemistry Lab session tomorrow',
      time: '2 days ago',
      icon: Clock
    }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.primary }}>Teacher Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your teaching activities.</p>
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


        {/* Current Courses Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>Current Courses</h2>
          <div className="space-y-4">
            {coursesLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="border border-gray-100 rounded-lg p-4 animate-pulse">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </div>
                  <div className="mb-2">
                    <div className="h-2 bg-gray-200 rounded-full mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded-full w-1/2"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))
            ) : coursesError ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">
                  <BookOpen size={48} className="mx-auto mb-4" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Courses</h3>
                <p className="text-gray-500 mb-4">{coursesError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <BookOpen size={48} className="mx-auto mb-4" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courses Assigned</h3>
                <p className="text-gray-500">You don't have any courses assigned yet.</p>
              </div>
            ) : (
              courses.map((course, index) => (
                <div key={course.id || index} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold" style={{ color: COLORS.text }}>{course.name}</h3>
                      <p className="text-sm text-gray-600">{course.students} students enrolled</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {course.status === 'completed' ? 'Completed' : 'Active'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className='text-black'> Progress</span>
                      <span className='text-gray-500'>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${course.progress}%`,
                          background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.secondary}80)`
                        }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    <Clock size={14} className="inline mr-1" />
                    Next: {course.nextSession}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>


    </div>
  );
}
