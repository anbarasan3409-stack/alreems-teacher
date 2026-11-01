import axios from 'axios';

const apiInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api` || 'http://localhost:9000/api',
  withCredentials: true,
});

export const EndPoints = {
  // Teacher Profile
  TEACHER_PROFILE: '/teacher/profile',
  TEACHER_PROFILE_UPDATE: '/teacher/profile/update',
  
  // Auth endpoints
  LOGOUT: '/teacher/auth/logout',
  REFRESH: '/teacher/auth/refresh',
  
  // Student endpoints (teacher access)
  STUDENTS: '/teacher/students',
  STUDENT_BY_ID: (id) => `/teacher/students/${id}`,
  
  // Course endpoints
  COURSES: '/teacher/courses',
  COURSE_BY_ID: (id) => `/teacher/courses/${id}`,
  COURSE_STUDENTS: (courseId) => `/teacher/courses/${courseId}/students`,
  
  // Session endpoints
  SESSIONS: '/teacher/sessions',
  SESSION_BY_ID: (id) => `/teacher/sessions/${id}`,
  
  // Assignment endpoints
  ASSIGNMENTS: '/teacher/assignments',
  ASSIGNMENT_BY_ID: (id) => `/teacher/assignments/${id}`,
};

export const apiEndpoints = EndPoints;

export default apiInstance;
