import { useState } from 'react';
import { FileText, Plus, Search, Filter, Calendar, Clock, Users, CheckCircle, AlertCircle, Eye, Edit, Trash2, BookOpen, TrendingUp, Award } from 'lucide-react';
import { COLORS } from '@/theme/themeConstants';

export default function Assignments() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const courses = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'English',
    'Biology',
    'History',
    'Geography',
    'Computer Science'
  ];

  const assignments = [
    {
      id: 1,
      title: 'Quadratic Equations Problem Set',
      course: 'Mathematics',
      description: 'Solve the following quadratic equations and show all work.',
      dueDate: '2025-09-10',
      totalStudents: 25,
      submitted: 18,
      pending: 7,
      status: 'active',
      createdDate: '2025-09-01',
      type: 'homework'
    },
    {
      id: 2,
      title: 'Physics Lab Report - Motion',
      course: 'Physics',
      description: 'Write a complete lab report on the motion experiment conducted in class.',
      dueDate: '2025-09-08',
      totalStudents: 20,
      submitted: 15,
      pending: 5,
      status: 'active',
      createdDate: '2025-08-28',
      type: 'lab'
    },
    {
      id: 3,
      title: 'Chemistry Quiz - Periodic Table',
      course: 'Chemistry',
      description: 'Multiple choice quiz on elements and their properties.',
      dueDate: '2025-08-25',
      totalStudents: 22,
      submitted: 22,
      pending: 0,
      status: 'completed',
      createdDate: '2025-08-20',
      type: 'quiz'
    },
    {
      id: 4,
      title: 'English Literature Analysis',
      course: 'English',
      description: 'Analyze the themes and characters in the assigned reading.',
      dueDate: '2025-09-15',
      totalStudents: 18,
      submitted: 8,
      pending: 10,
      status: 'active',
      createdDate: '2025-09-05',
      type: 'essay'
    },
    {
      id: 5,
      title: 'Biology Research Project',
      course: 'Biology',
      description: 'Research and present on a chosen biological topic.',
      dueDate: '2025-09-20',
      totalStudents: 16,
      submitted: 5,
      pending: 11,
      status: 'active',
      createdDate: '2025-09-03',
      type: 'project'
    }
  ];

  const statsCards = [
    {
      title: 'Total Assignments',
      value: assignments.length.toString(),
      icon: FileText,
      color: COLORS.secondary,
      change: '+2 this week',
      changeType: 'positive'
    },
    {
      title: 'Pending Submissions',
      value: assignments.reduce((sum, a) => sum + a.pending, 0).toString(),
      icon: Clock,
      color: '#FF9800',
      change: 'Due soon',
      changeType: 'neutral'
    },
    {
      title: 'Completed',
      value: assignments.filter(a => a.status === 'completed').length.toString(),
      icon: CheckCircle,
      color: '#4CAF50',
      change: 'This month',
      changeType: 'neutral'
    },
    {
      title: 'Average Grade',
      value: '87%',
      icon: Award,
      color: COLORS.primary,
      change: '+5% from last month',
      changeType: 'positive'
    }
  ];

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || assignment.course === selectedCourse;
    const matchesTab = activeTab === 'all' ||
                      (activeTab === 'active' && assignment.status === 'active') ||
                      (activeTab === 'completed' && assignment.status === 'completed');

    return matchesSearch && matchesCourse && matchesTab;
  });

  const handleCreateAssignment = () => {
    setShowCreateModal(true);
  };

  const handleViewAssignment = (assignmentId) => {
    // Navigate to assignment details or open modal
  };

  const handleEditAssignment = (assignmentId) => {
    // Open edit modal or navigate to edit page
  };

  const handleDeleteAssignment = (assignmentId) => {
    // Show confirmation dialog and delete
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'homework':
        return BookOpen;
      case 'quiz':
        return FileText;
      case 'lab':
        return TrendingUp;
      case 'essay':
        return Edit;
      case 'project':
        return Award;
      default:
        return FileText;
    }
  };

  const getSubmissionRate = (submitted, total) => {
    return Math.round((submitted / total) * 100);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.primary }}>Assignments</h1>
        <p className="text-gray-600">Create, manage, and grade student assignments</p>
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
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Assignments
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'active'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Create Assignment Button */}
          <button
            onClick={handleCreateAssignment}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors hover:shadow-lg"
            style={{
              backgroundColor: COLORS.secondary,
              color: COLORS.background
            }}
          >
            <Plus size={20} />
            Create Assignment
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.map((assignment) => {
          const TypeIcon = getTypeIcon(assignment.type);
          const submissionRate = getSubmissionRate(assignment.submitted, assignment.totalStudents);

          return (
            <div key={assignment.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${COLORS.secondary}15` }}>
                      <TypeIcon size={24} style={{ color: COLORS.secondary }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold mb-1" style={{ color: COLORS.text }}>{assignment.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{assignment.course}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>Due: {formatDate(assignment.dueDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>{assignment.submitted}/{assignment.totalStudents} submitted</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>Created: {formatDate(assignment.createdDate)}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Submission Progress</span>
                          <span>{submissionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${submissionRate}%`,
                              background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.secondary}80)`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleViewAssignment(assignment.id)}
                    className="p-2 text-gray-400 hover:text-secondary hover:bg-secondary/5 rounded-lg transition-colors"
                    title="View Assignment"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEditAssignment(assignment.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Assignment"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Assignment"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No assignments found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCourse !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first assignment to get started.'}
          </p>
          {!searchTerm && selectedCourse === 'all' && (
            <button
              onClick={handleCreateAssignment}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors hover:shadow-lg"
              style={{
                backgroundColor: COLORS.secondary,
                color: COLORS.background
              }}
            >
              <Plus size={20} />
              Create Assignment
            </button>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-secondary transition-colors group">
            <Plus size={24} className="text-gray-400 group-hover:text-secondary" />
            <span className="text-sm font-medium text-gray-600">New Assignment</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-secondary transition-colors group">
            <FileText size={24} className="text-gray-400 group-hover:text-secondary" />
            <span className="text-sm font-medium text-gray-600">Grade Submissions</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-secondary transition-colors group">
            <Calendar size={24} className="text-gray-400 group-hover:text-secondary" />
            <span className="text-sm font-medium text-gray-600">Schedule Due Dates</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-secondary transition-colors group">
            <TrendingUp size={24} className="text-gray-400 group-hover:text-secondary" />
            <span className="text-sm font-medium text-gray-600">View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}
