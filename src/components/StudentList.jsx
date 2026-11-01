import { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Mail, Phone, Calendar, Award, BookOpen } from 'lucide-react';
import { COLORS } from '@/theme/themeConstants';

export default function StudentList({ onStudentSelect }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const studentsPerPage = 8;

  // TODO: Replace with API calls
  const students = [];
  const grades = ['all', 'Grade 9', 'Grade 10', 'Grade 11'];
  const courses = ['all', 'Mathematics', 'Physics', 'Chemistry', 'English'];

  // Filter students based on search term, grade, and course
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    const matchesCourse = selectedCourse === 'all' || student.course === selectedCourse;

    return matchesSearch && matchesGrade && matchesCourse;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getPerformanceColor = (performance) => {
    if (performance >= 90) return '#4CAF50';
    if (performance >= 80) return '#2196F3';
    if (performance >= 70) return '#FF9800';
    return '#F44336';
  };

  const getPerformanceGrade = (performance) => {
    if (performance >= 90) return 'A';
    if (performance >= 80) return 'B';
    if (performance >= 70) return 'C';
    if (performance >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.primary }}>Students</h1>
        <p className="text-gray-600">Manage and view all enrolled students</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10" size={20} />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
              />
            </div>
          </div>

          {/* Grade Filter */}
          <div className="w-full lg:w-48">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent text-gray-900 bg-white"
            >
              {grades.map(grade => (
                <option key={grade} value={grade}>
                  {grade === 'all' ? 'All Grades' : grade}
                </option>
              ))}
            </select>
          </div>

          {/* Course Filter */}
          <div className="w-full lg:w-48">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent text-gray-900 bg-white"
            >
              {courses.map(course => (
                <option key={course} value={course}>
                  {course === 'all' ? 'All Courses' : course}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="divide-y divide-gray-100">
          {currentStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => onStudentSelect(student)}
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.secondary}80)` }}
                  >
                    {student.avatar}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg truncate" style={{ color: COLORS.text }}>{student.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{student.email}</p>
                      </div>

                      <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} />
                          <span className="truncate max-w-24">{student.course}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{student.grade}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile view additional info */}
                    <div className="md:hidden mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>{student.course}</span>
                      <span>•</span>
                      <span>{student.grade}</span>
                    </div>
                  </div>
                </div>

                {/* Performance and Status */}
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Award size={16} style={{ color: getPerformanceColor(student.performance) }} />
                      <span className="font-medium" style={{ color: getPerformanceColor(student.performance) }}>
                        {student.performance}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {student.assignmentsCompleted}/{student.totalAssignments} assignments
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {student.status}
                    </span>
                    <span className="text-xs text-gray-500 hidden lg:block">
                      Grade {getPerformanceGrade(student.performance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 rounded-lg border ${
                  currentPage === page
                    ? 'bg-secondary text-white border-secondary'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Filter size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No students found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
