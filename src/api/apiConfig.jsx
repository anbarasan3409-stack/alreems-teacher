// API Configuration for Alreems Teacher Portal
// This file contains all the API endpoints and configurations

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9000';

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication Routes (Teacher-specific)
  AUTH: {
    GOOGLE_SIGNUP: `${API_BASE_URL}/api/auth/teacher/google/signup`,
    GOOGLE_LOGIN: `${API_BASE_URL}/api/auth/teacher/google/login`,
    GOOGLE_CALLBACK: `${API_BASE_URL}/api/auth/google/callback`,
    REFRESH_TOKEN: `${API_BASE_URL}/api/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  },

  // Teacher Authentication & Profile Routes
  TEACHER_AUTH: {
    PROFILE: `${API_BASE_URL}/api/teacher/profile`,
    REFRESH_TOKEN: `${API_BASE_URL}/api/teacher/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/teacher/auth/logout`,
  },

  // Student Routes (for teacher access)
  STUDENTS: {
    GET_ALL: `${API_BASE_URL}/api/teacher/students`,
    GET_BY_ID: (id) => `${API_BASE_URL}/api/teacher/students/${id}`,
    UPDATE_PROFILE: (id) => `${API_BASE_URL}/api/teacher/students/${id}`,
  },

  // Course Routes (for teacher management)
  COURSES: {
    GET_ALL: `${API_BASE_URL}/api/teacher/courses`,
    GET_BY_ID: (id) => `${API_BASE_URL}/api/teacher/courses/${id}`,
    GET_STUDENTS: (courseId) => `${API_BASE_URL}/api/teacher/courses/${courseId}/students`,
    CREATE: `${API_BASE_URL}/api/teacher/courses`,
    UPDATE: (id) => `${API_BASE_URL}/api/teacher/courses/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/teacher/courses/${id}`,
  },

  // Session Routes (for teacher management)
  SESSIONS: {
    GET_ALL: `${API_BASE_URL}/api/teacher/sessions`,
    GET_BY_ID: (id) => `${API_BASE_URL}/api/teacher/sessions/${id}`,
    CREATE: `${API_BASE_URL}/api/teacher/sessions`,
    UPDATE: (id) => `${API_BASE_URL}/api/teacher/sessions/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/teacher/sessions/${id}`,
  },

  // Assignment Routes
  ASSIGNMENTS: {
    GET_BY_COURSE: (courseId) => `${API_BASE_URL}/api/teacher/courses/${courseId}/assignments`,
    CREATE: `${API_BASE_URL}/api/teacher/assignments`,
    UPDATE: (id) => `${API_BASE_URL}/api/teacher/assignments/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/teacher/assignments/${id}`,
    GET_SUBMISSIONS: (assignmentId) => `${API_BASE_URL}/api/teacher/assignments/${assignmentId}/submissions`,
    GRADE: (submissionId) => `${API_BASE_URL}/api/teacher/assignments/submissions/${submissionId}/grade`,
  },

  // Materials Routes
  MATERIALS: {
    CREATE: `${API_BASE_URL}/api/teacher/materials`,
    GET_BY_COURSE: (courseId) => `${API_BASE_URL}/api/teacher/courses/${courseId}/materials`,
    DELETE: (id) => `${API_BASE_URL}/api/teacher/materials/${id}`,
  },

  // Attendance Routes
  ATTENDANCE: {
    MARK: `${API_BASE_URL}/api/teacher/attendance`,
    GET_SESSION_ATTENDANCE: (sessionId) => `${API_BASE_URL}/api/teacher/attendance/session/${sessionId}`,
  },
};

// API Request Configuration
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies with requests
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

// Common API Response Status
export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Messages
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input data.',
};

// Helper function to build full URLs
export const buildUrl = (baseUrl, params = {}) => {
  let url = baseUrl;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return url;
};

// Helper function to handle API responses
export const handleApiResponse = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response.data;
  } else {
    throw new Error(response.data?.error || API_ERROR_MESSAGES.SERVER_ERROR);
  }
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.error || error.message;

    switch (status) {
      case 401:
        return { error: API_ERROR_MESSAGES.UNAUTHORIZED, status };
      case 403:
        return { error: 'Access forbidden', status };
      case 404:
        return { error: 'Resource not found', status };
      case 500:
        return { error: API_ERROR_MESSAGES.SERVER_ERROR, status };
      default:
        return { error: message, status };
    }
  } else if (error.request) {
    // Network error
    return { error: API_ERROR_MESSAGES.NETWORK_ERROR, status: null };
  } else {
    // Other error
    return { error: error.message, status: null };
  }
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  API_CONFIG,
  HTTP_METHODS,
  API_STATUS,
  API_ERROR_MESSAGES,
  buildUrl,
  handleApiResponse,
  handleApiError,
};
