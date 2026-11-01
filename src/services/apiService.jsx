// Teacher API service for Alreems Teacher Portal
// This file contains all the API service functions for teachers

import axios from 'axios';
import { API_ENDPOINTS, API_CONFIG, handleApiResponse, handleApiError } from '../api/apiConfig';

// Configure axios defaults
axios.defaults.withCredentials = true;

// Authentication Service
export const authService = {
  // Initiate Google OAuth signup
  initiateGoogleSignup: async () => {
    try {
      window.location.href = API_ENDPOINTS.AUTH.GOOGLE_SIGNUP;
    } catch (error) {
    }
  },

  // Initiate Google OAuth login
  initiateGoogleLogin: async () => {
    try {
      window.location.href = API_ENDPOINTS.AUTH.GOOGLE_LOGIN;
    } catch (error) {
    }
  },

  // Get teacher profile
  getTeacherProfile: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.TEACHER_AUTH.PROFILE, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update teacher profile
  updateTeacherProfile: async (profileData) => {
    try {
      const response = await axios.put(API_ENDPOINTS.TEACHER_AUTH.PROFILE, profileData, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Refresh authentication token
  refreshToken: async () => {
    try {
      const response = await axios.post(API_ENDPOINTS.TEACHER_AUTH.REFRESH_TOKEN, {}, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Logout teacher
  logout: async () => {
    try {
      const response = await axios.post(API_ENDPOINTS.TEACHER_AUTH.LOGOUT, {}, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Teacher Service
export const teacherService = {
  // Get teacher dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.TEACHER_AUTH.PROFILE}/stats`, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get all students enrolled in teacher's courses
  getAllStudents: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.STUDENTS.GET_ALL, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get teacher's courses
  getTeacherCourses: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.COURSES.GET_ALL, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get students enrolled in a specific course
  getCourseStudents: async (courseId) => {
    try {
      const response = await axios.get(API_ENDPOINTS.COURSES.GET_STUDENTS(courseId), API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get student by ID
  getStudentById: async (studentId) => {
    try {
      const response = await axios.get(API_ENDPOINTS.STUDENTS.GET_BY_ID(studentId), API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update student profile (limited teacher access)
  updateStudentProfile: async (studentId, profileData) => {
    try {
      const response = await axios.put(API_ENDPOINTS.STUDENTS.UPDATE_PROFILE(studentId), profileData, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Course Service
export const courseService = {
  // Get teacher's assigned courses
  getTeacherCourses: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.COURSES.GET_ALL, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get course by ID
  getCourseById: async (courseId) => {
    try {
      const response = await axios.get(API_ENDPOINTS.COURSES.GET_BY_ID(courseId), API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create new course
  createCourse: async (courseData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.COURSES.CREATE, courseData, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update course
  updateCourse: async (courseId, courseData) => {
    try {
      const response = await axios.put(API_ENDPOINTS.COURSES.UPDATE(courseId), courseData, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete course
  deleteCourse: async (courseId) => {
    try {
      const response = await axios.delete(API_ENDPOINTS.COURSES.DELETE(courseId), API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get course students
  getCourseStudents: async (courseId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.COURSES.GET_BY_ID(courseId)}/students`, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Session Service
export const sessionService = {
  // Get teacher's sessions
  getTeacherSessions: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.SESSIONS.GET_ALL, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get session by ID
  getSessionById: async (sessionId) => {
    try {
      const response = await axios.get(API_ENDPOINTS.SESSIONS.GET_BY_ID(sessionId), API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create new session
  createSession: async (sessionData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.SESSIONS.CREATE, sessionData, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update session
  updateSession: async (sessionId, sessionData) => {
    try {
      const response = await axios.put(API_ENDPOINTS.SESSIONS.UPDATE(sessionId), sessionData, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete session
  deleteSession: async (sessionId) => {
    try {
      const response = await axios.delete(API_ENDPOINTS.SESSIONS.DELETE(sessionId), API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Start session
  startSession: async (sessionId) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.SESSIONS.GET_BY_ID(sessionId)}/start`, {}, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // End session
  endSession: async (sessionId) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.SESSIONS.GET_BY_ID(sessionId)}/end`, {}, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get session attendees
  getSessionAttendees: async (sessionId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.SESSIONS.GET_BY_ID(sessionId)}/attendees`, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get Agora RTC token for session
  getSessionRTCToken: async (sessionId, role = 'teacher') => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.SESSIONS.GET_BY_ID(sessionId)}/rtc-token?role=${role}`, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Assignment Service
export const assignmentService = {
  // Get assignments by course
  getAssignmentsByCourse: async (courseId) => {
    try {
      const response = await axios.get(API_ENDPOINTS.ASSIGNMENTS.GET_BY_COURSE(courseId), API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create new assignment
  createAssignment: async (assignmentData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.ASSIGNMENTS.CREATE, assignmentData, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update assignment
  updateAssignment: async (assignmentId, assignmentData) => {
    try {
      const response = await axios.put(API_ENDPOINTS.ASSIGNMENTS.UPDATE(assignmentId), assignmentData, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete assignment
  deleteAssignment: async (assignmentId) => {
    try {
      const response = await axios.delete(API_ENDPOINTS.ASSIGNMENTS.DELETE(assignmentId), API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Grade assignment submission
  gradeAssignment: async (submissionId, gradeData) => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.ASSIGNMENTS.GRADE(submissionId),
        gradeData,
        API_CONFIG
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get assignment submissions
  getAssignmentSubmissions: async (assignmentId) => {
    try {
      const response = await axios.get(API_ENDPOINTS.ASSIGNMENTS.GET_SUBMISSIONS(assignmentId), API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Material Service
export const materialService = {
  // Get materials by course
  getMaterialsByCourse: async (courseId) => {
    try {
      const response = await axios.get(API_ENDPOINTS.MATERIALS.GET_BY_COURSE(courseId), API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create new material
  createMaterial: async (materialData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.MATERIALS.CREATE, materialData, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete material
  deleteMaterial: async (materialId) => {
    try {
      const response = await axios.delete(API_ENDPOINTS.MATERIALS.DELETE(materialId), API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Analytics Service
export const analyticsService = {
  // Get teacher analytics
  getTeacherAnalytics: async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.TEACHER_AUTH.PROFILE}/analytics`, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get course analytics
  getCourseAnalytics: async (courseId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.COURSES.GET_BY_ID(courseId)}/analytics`, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get session analytics
  getSessionAnalytics: async (sessionId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.SESSIONS.GET_BY_ID(sessionId)}/analytics`, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get student progress
  getStudentProgress: async (studentId, courseId = null) => {
    try {
      const url = courseId 
        ? `${API_ENDPOINTS.STUDENTS.GET_BY_ID(studentId)}/progress?courseId=${courseId}`
        : `${API_ENDPOINTS.STUDENTS.GET_BY_ID(studentId)}/progress`;
      const response = await axios.get(url, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Attendance Service
export const attendanceService = {
  markAttendance: async (attendanceData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.ATTENDANCE.MARK, attendanceData, API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },
  getSessionAttendance: async (sessionId) => {
    try {
      const response = await axios.get(API_ENDPOINTS.ATTENDANCE.GET_SESSION_ATTENDANCE(sessionId), API_CONFIG);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export default {
  authService,
  teacherService,
  courseService,
  sessionService,
  assignmentService,
  analyticsService,
  attendanceService,
  materialService,
};
