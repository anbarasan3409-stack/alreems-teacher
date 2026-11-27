import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Calendar, Clock, Users, CheckCircle, Eye, Trash2, BookOpen, X, ExternalLink, Award } from 'lucide-react';
import { COLORS } from '@/theme/themeConstants';
import { assignmentService, courseService } from '@/services/apiService';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    due_date: '',
    total_marks: 100
  });

  // Submissions modal state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const coursesRes = await courseService.getTeacherCourses();
      const teacherCourses = Array.isArray(coursesRes) ? coursesRes : (coursesRes?.courses || []);
      setCourses(teacherCourses);

      if (teacherCourses.length > 0 && !formData.course_id) {
        setFormData(prev => ({ ...prev, course_id: String(teacherCourses[0].id || teacherCourses[0].ID) }));
      }

      const assignmentArrays = await Promise.all(
        teacherCourses.map(async (c) => {
          const cid = c.id || c.ID;
          const cname = c.name || c.title || c.Name || `Course #${cid}`;
          try {
            const res = await assignmentService.getAssignmentsByCourse(cid);
            const list = Array.isArray(res) ? res : (res?.assignments || []);
            return list.map(a => ({ ...a, course_name: a.course?.name || a.course?.Name || cname }));
          } catch (e) {
            return [];
          }
        })
      );

      setAssignments(assignmentArrays.flat());
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.course_id || !formData.due_date) {
      alert('Please fill in Title, Course, and Due Date');
      return;
    }

    try {
      setCreating(true);
      await assignmentService.createAssignment({
        title: formData.title.trim(),
        description: formData.description.trim(),
        course_id: parseInt(formData.course_id, 10),
        due_date: new Date(`${formData.due_date}T23:59:59`).toISOString(),
        total_marks: parseInt(formData.total_marks, 10) || 100
      });
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        course_id: courses[0] ? String(courses[0].id || courses[0].ID) : '',
        due_date: '',
        total_marks: 100
      });
      await fetchAllData();
    } catch (error) {
      alert('Failed to create assignment: ' + (error?.error || error?.message || 'Unknown error'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await assignmentService.deleteAssignment(assignmentId);
      setAssignments(prev => prev.filter(a => (a.id || a.ID) !== assignmentId));
    } catch (error) {
      alert('Failed to delete assignment');
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissions([]);
    setLoadingSubmissions(true);
    try {
      const res = await assignmentService.getSubmissions(assignment.id || assignment.ID);
      setSubmissions(Array.isArray(res) ? res : (res?.submissions || []));
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGradeSubmission = async (submissionId) => {
    const marksStr = prompt('Enter marks obtained:');
    if (marksStr === null) return;
    const marks = parseInt(marksStr, 10);
    if (isNaN(marks)) {
      alert('Please enter a valid number for marks.');
      return;
    }
    const feedback = prompt('Enter feedback (optional):') || '';
    try {
      await assignmentService.gradeSubmission(submissionId, marks, feedback);
      setSubmissions(prev =>
        prev.map(s => (s.id || s.ID) === submissionId ? { ...s, marks_obtained: marks, feedback, status: 'graded' } : s)
      );
    } catch (error) {
      alert('Failed to grade submission');
    }
  };

  const isPastDue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const activeCount = assignments.filter(a => !isPastDue(a.due_date)).length;
  const pastDueCount = assignments.filter(a => isPastDue(a.due_date)).length;

  const statsCards = [
    {
      title: 'Total Assignments',
      value: assignments.length.toString(),
      icon: FileText,
      color: COLORS.secondary,
      change: `${courses.length} courses`,
      changeType: 'neutral'
    },
    {
      title: 'Active Assignments',
      value: activeCount.toString(),
      icon: Clock,
      color: '#FF9800',
      change: 'Open',
      changeType: 'neutral'
    },
    {
      title: 'Past Due',
      value: pastDueCount.toString(),
      icon: CheckCircle,
      color: '#4CAF50',
      change: 'Closed',
      changeType: 'neutral'
    },
    {
      title: 'Courses',
      value: courses.length.toString(),
      icon: BookOpen,
      color: COLORS.primary,
      change: 'Assigned',
      changeType: 'neutral'
    }
  ];

  const filteredAssignments = assignments.filter(assignment => {
    const title = (assignment.title || '').toLowerCase();
    const courseName = (assignment.course_name || '').toLowerCase();
    const matchesSearch = title.includes(searchTerm.toLowerCase()) || courseName.includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || String(assignment.course_id) === String(selectedCourse);
    const pastDue = isPastDue(assignment.due_date);
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && !pastDue) ||
      (activeTab === 'completed' && pastDue);

    return matchesSearch && matchesCourse && matchesTab;
  });

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
                <span className="text-sm font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
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
              className={`px-6 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Assignments
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'completed' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Past Due
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            disabled={courses.length === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors hover:shadow-lg disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: COLORS.secondary, color: COLORS.background }}
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
                <option key={course.id || course.ID} value={course.id || course.ID}>
                  {course.name || course.title || course.Name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading assignments...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No assignments found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCourse !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first assignment to get started.'}
          </p>
          {!searchTerm && selectedCourse === 'all' && courses.length > 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors hover:shadow-lg cursor-pointer"
              style={{ backgroundColor: COLORS.secondary, color: COLORS.background }}
            >
              <Plus size={20} />
              Create Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const aid = assignment.id || assignment.ID;
            const pastDue = isPastDue(assignment.due_date);

            return (
              <div key={aid} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${COLORS.secondary}15` }}
                      >
                        <BookOpen size={24} style={{ color: COLORS.secondary }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold mb-1" style={{ color: COLORS.text }}>
                              {assignment.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">{assignment.course_name}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              pastDue ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {pastDue ? 'Past Due' : 'Active'}
                          </span>
                        </div>

                        {assignment.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>Due: {formatDate(assignment.due_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award size={16} />
                            <span>Total Marks: {assignment.total_marks || 100}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>Created: {formatDate(assignment.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleViewSubmissions(assignment)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="View & Grade Submissions"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(aid)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold" style={{ color: COLORS.primary }}>Create Assignment</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id || c.ID} value={c.id || c.ID}>
                      {c.name || c.title || c.Name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Assignment title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 text-white rounded-lg font-medium disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: COLORS.secondary }}
                >
                  {creating ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {selectedAssignment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold" style={{ color: COLORS.primary }}>
                  {selectedAssignment.title} — Submissions
                </h2>
                <p className="text-sm text-gray-500">{selectedAssignment.course_name}</p>
              </div>
              <button onClick={() => setSelectedAssignment(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={22} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {loadingSubmissions ? (
                <p className="text-center text-gray-500 py-8">Loading submissions...</p>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users size={36} className="mx-auto mb-2 text-gray-300" />
                  <p>No student submissions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => {
                    const sid = sub.id || sub.ID;
                    const studentName = sub.student?.name || sub.student?.Name || `Student #${sub.student_id}`;
                    return (
                      <div key={sid} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{studentName}</p>
                          <p className="text-xs text-gray-500">
                            Status: {sub.status} • Marks: {sub.marks_obtained ?? 0}/{selectedAssignment.total_marks || 100}
                          </p>
                          {sub.feedback && <p className="text-xs text-gray-600 mt-1">Feedback: {sub.feedback}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {sub.file_url && (
                            <a
                              href={sub.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1"
                            >
                              <ExternalLink size={12} />
                              View File
                            </a>
                          )}
                          <button
                            onClick={() => handleGradeSubmission(sid)}
                            className="px-3 py-1.5 text-xs text-white rounded-lg cursor-pointer"
                            style={{ backgroundColor: COLORS.secondary }}
                          >
                            Grade
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
