'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthService } from '@/services/auth/AuthService';
import apiInstance, { EndPoints } from '@/api/apiInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [justLoggedOut, setJustLoggedOut] = useState(() => {
    // Check localStorage for logout state on initialization
    if (typeof window !== 'undefined') {
      return localStorage.getItem('justLoggedOut') === 'true';
    }
    return false;
  });

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if we're in the callback route - if so, clear logout flag
      if (typeof window !== 'undefined' && window.location.pathname === '/auth/callback') {
        setJustLoggedOut(false);
        localStorage.removeItem('justLoggedOut');
      }
      
      // If user just logged out and we're not in callback, don't check authentication
      if (justLoggedOut && typeof window !== 'undefined' && window.location.pathname !== '/auth/callback') {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Try to call the API directly without checking cookies first
      try {
        const userData = await AuthService.getTeacherProfile();
        setUser(userData);
        setIsAuthenticated(true);
        setJustLoggedOut(false); // Reset logout flag on successful auth check
        localStorage.removeItem('justLoggedOut'); // Clear localStorage flag
      } catch (apiError) {
        // If API call fails, check if we have a cookie
        const hasRefreshToken = document.cookie.includes('refresh_token');
        
        if (!hasRefreshToken) {
          setIsAuthenticated(false);
          setUser(null);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [justLoggedOut]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async () => {
    try {
      setLoading(true);
      setJustLoggedOut(false); // Reset logout flag on new login attempt
      localStorage.removeItem('justLoggedOut'); // Clear localStorage flag
      window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/teacher/google/login`;
    } catch (error) {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      setJustLoggedOut(true);
      
      // Set localStorage flag to persist logout state across page reloads
      localStorage.setItem('justLoggedOut', 'true');

      // Call logout endpoint to clear server-side session
      await apiInstance.post(EndPoints.LOGOUT);

      // Clear local state immediately
      setUser(null);
      setIsAuthenticated(false);

      // Clear cookies
      document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Add a small delay to ensure server-side logout is processed
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to login page
      window.location.href = '/';
    } catch (error) {
      // Even if logout fails on server, clear local state
      setUser(null);
      setIsAuthenticated(false);
      document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const response = await apiInstance.post(EndPoints.REFRESH);

      if (response.status === 200) {
        const userData = response.data.teacher;
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } else {
        // Refresh failed, user needs to login again
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  }, []);

  const getProfile = async () => {
    try {
      const userData = await AuthService.getTeacherProfile();
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const clearLogoutState = useCallback(() => {
    setJustLoggedOut(false);
    localStorage.removeItem('justLoggedOut');
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    justLoggedOut,
    login,
    logout,
    checkAuthStatus,
    refreshToken,
    getProfile,
    clearLogoutState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
