import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, Clock } from 'lucide-react';
import { COLORS } from '@/theme/themeConstants';
import { attendanceService, courseService } from '@/services/apiService';

export default function AttendanceModal({ session, onClose }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch students for the course
        const courseId = session.course_id || session.CourseID;
        let studentsData = [];
        if (courseId) {
          const res = await courseService.getCourseStudents(courseId);
          studentsData = Array.isArray(res) ? res : (res?.students || []);
        }

        // 2. Fetch existing attendance
        const sessionId = session.id || session.ID;
        let existingAttendance = [];
        try {
          existingAttendance = await attendanceService.getSessionAttendance(sessionId);
        } catch (err) {
          console.warn("No existing attendance found or error fetching", err);
        }

        // 3. Merge data
        const initialAttendance = {};
        const attendanceMap = {};
        if (Array.isArray(existingAttendance)) {
          existingAttendance.forEach(a => {
            attendanceMap[a.student_id] = a.status;
          });
        }

        studentsData.forEach(student => {
          const studentId = student.ID || student.id;
          initialAttendance[studentId] = attendanceMap[studentId] || 'absent';
        });

        setStudents(studentsData);
        setAttendance(initialAttendance);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const sessionId = session.id || session.ID;
      const attendancesToSave = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status
      }));

      await attendanceService.markAttendance({
        session_id: sessionId,
        attendances: attendancesToSave
      });

      alert('Attendance saved successfully');
      onClose();
    } catch (error) {
      alert('Failed to save attendance: ' + (error?.error || error?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: COLORS.primary }}>Mark Attendance</h2>
            <p className="text-sm text-gray-600">Session: {session.Title || session.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No students found in this course.</div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => {
                const studentId = student.ID || student.id;
                const status = attendance[studentId];
                return (
                  <div key={studentId} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {student.ProfilePicture ? (
                          <img src={student.ProfilePicture} alt={student.Name || student.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500 font-medium">
                            {(student.Name || student.name || 'S').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.Name || student.name}</p>
                        <p className="text-xs text-gray-500">{student.Email || student.email}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(studentId, 'present')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm font-medium transition-colors ${
                          status === 'present' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
                        } border`}
                      >
                        <Check size={16} /> Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(studentId, 'absent')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm font-medium transition-colors ${
                          status === 'absent' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
                        } border`}
                      >
                        <XCircle size={16} /> Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(studentId, 'late')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm font-medium transition-colors ${
                          status === 'late' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
                        } border`}
                      >
                        <Clock size={16} /> Late
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            style={{ backgroundColor: COLORS.secondary, color: COLORS.background, opacity: (loading || saving) ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
}
