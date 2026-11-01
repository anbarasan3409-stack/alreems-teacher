import { BookOpen, TrendingUp, Clock, CheckCircle, AlertCircle, FileText, Users, Calendar, Award, Target, BarChart3 } from 'lucide-react';
import { COLORS } from '@/theme/themeConstants';

export default function StudentProfile({ student }) {
  const studentInfo = student ? {
    name: student.name,
    email: student.email,
    grade: student.grade,
    enrollmentDate: new Date(student.enrollmentDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } : {
    name: 'John Doe',
    email: 'john.doe@student.alreems.com',
    grade: 'Grade 10',
    enrollmentDate: 'September 2024'
  };

  const scoresData = student ? [
    {
      subject: student.course,
      currentScore: student.performance,
      grade: student.performance >= 90 ? 'A' : student.performance >= 80 ? 'B' : student.performance >= 70 ? 'C' : 'D',
      trend: '+5%',
      color: student.performance >= 90 ? '#4CAF50' : student.performance >= 80 ? '#2196F3' : '#FF9800'
    },
    {
      subject: 'Mathematics',
      currentScore: Math.max(0, student.performance - 5),
      grade: (student.performance - 5) >= 90 ? 'A' : (student.performance - 5) >= 80 ? 'B' : (student.performance - 5) >= 70 ? 'C' : 'D',
      trend: '+2%',
      color: (student.performance - 5) >= 90 ? '#4CAF50' : (student.performance - 5) >= 80 ? '#2196F3' : '#FF9800'
    },
    {
      subject: 'English',
      currentScore: Math.min(100, student.performance + 3),
      grade: (student.performance + 3) >= 90 ? 'A' : (student.performance + 3) >= 80 ? 'B' : (student.performance + 3) >= 70 ? 'C' : 'D',
      trend: '+3%',
      color: (student.performance + 3) >= 90 ? '#4CAF50' : (student.performance + 3) >= 80 ? '#2196F3' : '#FF9800'
    },
    {
      subject: 'Science',
      currentScore: Math.max(0, student.performance - 2),
      grade: (student.performance - 2) >= 90 ? 'A' : (student.performance - 2) >= 80 ? 'B' : (student.performance - 2) >= 70 ? 'C' : 'D',
      trend: '+1%',
      color: (student.performance - 2) >= 90 ? '#4CAF50' : (student.performance - 2) >= 80 ? '#2196F3' : '#FF9800'
    }
  ] : [
    {
      subject: 'Mathematics',
      currentScore: 85,
      grade: 'A',
      trend: '+5%',
      color: '#4CAF50'
    },
    {
      subject: 'Physics',
      currentScore: 78,
      grade: 'B+',
      trend: '+2%',
      color: '#2196F3'
    },
    {
      subject: 'Chemistry',
      currentScore: 92,
      grade: 'A+',
      trend: '+8%',
      color: '#4CAF50'
    },
    {
      subject: 'English',
      currentScore: 88,
      grade: 'A',
      trend: '+3%',
      color: '#4CAF50'
    }
  ];

  const assignmentsData = student ? [
    {
      title: `${student.course} Assignment #1`,
      subject: student.course,
      dueDate: 'Completed',
      status: 'completed',
      score: student.performance
    },
    {
      title: 'Weekly Quiz',
      subject: student.course,
      dueDate: 'Completed',
      status: 'completed',
      score: Math.max(0, student.performance - 5)
    },
    {
      title: 'Project Work',
      subject: student.course,
      dueDate: 'Tomorrow',
      status: 'pending',
      score: null
    },
    {
      title: 'Final Assessment',
      subject: student.course,
      dueDate: 'Next Week',
      status: 'upcoming',
      score: null
    }
  ] : [
    {
      title: 'Math Assignment #5',
      subject: 'Mathematics',
      dueDate: 'Tomorrow',
      status: 'pending',
      score: null
    },
    {
      title: 'Physics Lab Report',
      subject: 'Physics',
      dueDate: 'Submitted',
      status: 'completed',
      score: 85
    },
    {
      title: 'Chemistry Quiz',
      subject: 'Chemistry',
      dueDate: 'Submitted',
      status: 'completed',
      score: 92
    },
    {
      title: 'English Essay',
      subject: 'English',
      dueDate: '3 days ago',
      status: 'overdue',
      score: null
    }
  ];

  const progressData = student ? [
    {
      course: student.course,
      progress: Math.round((student.assignmentsCompleted / student.totalAssignments) * 100),
      completedLessons: student.assignmentsCompleted,
      totalLessons: student.totalAssignments,
      nextLesson: `Lesson ${student.assignmentsCompleted + 1}`
    },
    {
      course: 'General Studies',
      progress: Math.max(0, Math.round((student.assignmentsCompleted / student.totalAssignments) * 100) - 10),
      completedLessons: Math.max(0, student.assignmentsCompleted - 1),
      totalLessons: student.totalAssignments,
      nextLesson: 'Research Methods'
    },
    {
      course: 'Electives',
      progress: Math.min(100, Math.round((student.assignmentsCompleted / student.totalAssignments) * 100) + 5),
      completedLessons: Math.min(student.totalAssignments, student.assignmentsCompleted + 1),
      totalLessons: student.totalAssignments,
      nextLesson: 'Advanced Topics'
    }
  ] : [
    {
      course: 'Advanced Mathematics',
      progress: 75,
      completedLessons: 15,
      totalLessons: 20,
      nextLesson: 'Calculus Fundamentals'
    },
    {
      course: 'Physics Fundamentals',
      progress: 60,
      completedLessons: 12,
      totalLessons: 20,
      nextLesson: 'Newton\'s Laws'
    },
    {
      course: 'Chemistry Lab',
      progress: 85,
      completedLessons: 17,
      totalLessons: 20,
      nextLesson: 'Organic Chemistry'
    }
  ];

  const recentActivities = student ? [
    {
      type: 'assignment',
      message: `Completed ${student.course} Assignment`,
      time: '2 hours ago',
      icon: CheckCircle,
      score: student.performance
    },
    {
      type: 'quiz',
      message: `Scored ${student.performance}% on ${student.course} Quiz`,
      time: '1 day ago',
      icon: Award,
      score: student.performance
    },
    {
      type: 'lesson',
      message: `Completed ${student.course} Lesson ${student.assignmentsCompleted}`,
      time: '2 days ago',
      icon: BookOpen,
      score: null
    },
    {
      type: 'reminder',
      message: `${student.course} Assignment due tomorrow`,
      time: '3 hours ago',
      icon: Clock,
      score: null
    }
  ] : [
    {
      type: 'assignment',
      message: 'Completed Physics Lab Report',
      time: '2 hours ago',
      icon: CheckCircle,
      score: 85
    },
    {
      type: 'quiz',
      message: 'Scored 92% on Chemistry Quiz',
      time: '1 day ago',
      icon: Award,
      score: 92
    },
    {
      type: 'lesson',
      message: 'Completed Mathematics Lesson 15',
      time: '2 days ago',
      icon: BookOpen,
      score: null
    },
    {
      type: 'reminder',
      message: 'Math Assignment #5 due tomorrow',
      time: '3 hours ago',
      icon: Clock,
      score: null
    }
  ];

  return (
    <div className="p-8">
      {/* Student Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
            style={{ background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.secondary}80)` }}
          >
            {student ? student.avatar : studentInfo.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: COLORS.primary }}>{studentInfo.name}</h1>
            <p className="text-gray-600">{studentInfo.grade} • {studentInfo.email}</p>
            <p className="text-sm text-gray-500">Enrolled: {studentInfo.enrollmentDate}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${COLORS.secondary}15` }}
            >
              <Award size={20} style={{ color: COLORS.secondary }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: COLORS.text }}>{student ? student.performance : 86}%</p>
              <p className="text-sm text-gray-600">Overall Grade</p>
            </div>
          </div>
          <div className="text-sm text-green-600 font-medium">↑ +5% from last month</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${COLORS.primary}15` }}
            >
              <FileText size={20} style={{ color: COLORS.primary }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: COLORS.text }}>{student ? student.assignmentsCompleted : 12}</p>
              <p className="text-sm text-gray-600">Assignments Done</p>
            </div>
          </div>
          <div className="text-sm text-blue-600 font-medium">4 pending</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#4CAF5015' }}
            >
              <Target size={20} style={{ color: '#4CAF50' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: COLORS.text }}>{student ? Math.round((student.assignmentsCompleted / student.totalAssignments) * 100) : 73}%</p>
              <p className="text-sm text-gray-600">Course Progress</p>
            </div>
          </div>
          <div className="text-sm text-green-600 font-medium">On track</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Scores */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>Subject Scores</h2>
          <div className="space-y-4">
            {scoresData.map((subject, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${subject.color}15` }}
                  >
                    <BarChart3 size={18} style={{ color: subject.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: COLORS.text }}>{subject.subject}</h3>
                    <p className="text-sm text-gray-600">{subject.currentScore}% • Grade {subject.grade}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subject.trend.includes('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {subject.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>Assignments</h2>
          <div className="space-y-4">
            {assignmentsData.map((assignment, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold" style={{ color: COLORS.text }}>{assignment.title}</h3>
                  <p className="text-sm text-gray-600">{assignment.subject}</p>
                  <p className="text-xs text-gray-500">Due: {assignment.dueDate}</p>
                </div>
                <div className="text-right">
                  {assignment.status === 'completed' && assignment.score && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {assignment.score}%
                      </span>
                      <span className="text-xs text-green-600">Completed</span>
                    </div>
                  )}
                  {assignment.status === 'pending' && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  )}
                  {assignment.status === 'overdue' && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      Overdue
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Course Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>Course Progress</h2>
          <div className="space-y-6">
            {progressData.map((course, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold" style={{ color: COLORS.text }}>{course.course}</h3>
                    <p className="text-sm text-gray-600">{course.completedLessons}/{course.totalLessons} lessons completed</p>
                  </div>
                  <span className="text-sm font-medium" style={{ color: COLORS.secondary }}>
                    {course.progress}%
                  </span>
                </div>
                <div className="mb-3">
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
                  <BookOpen size={14} className="inline mr-1" />
                  Next: {course.nextLesson}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${COLORS.secondary}15` }}
                  >
                    <Icon size={16} style={{ color: COLORS.secondary }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: COLORS.text }}>
                      {activity.message}
                      {activity.score && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          {activity.score}%
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
