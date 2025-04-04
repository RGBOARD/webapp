import React, { useState, useEffect } from 'react';
import { 
  setToken, 
  getToken, 
  removeToken, 
  getUserFromToken, 
  isTokenExpired,
  hasRole,
  hasAnyRole
} from './jwtUtils';
import axios from '../api/axios';
import AuthContext from './authContext';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = () => {
      const token = getToken();
      if (token && !isTokenExpired()) {
        const user = getUserFromToken();
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else if (token) {
        // Token exists but is expired, clean up
        removeToken();
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login function - compatible with Flask-JWT-Extended
  const login = async (email, password) => {
    try {
      const response = await axios.post('/login', { email, password });
      
      // Extract token from various possible response formats
      let token = null;
      if (response.data.access_token) {
        token = response.data.access_token;
      } else if (response.data.token) {
        token = response.data.token;
      } else if (typeof response.data === 'string') {
        token = response.data;
      }
      
      if (token) {
        setToken(token);
        const user = getUserFromToken();
        setCurrentUser(user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Authentication failed. No token received.' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Authentication failed' 
      };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await axios.post('/user', userData);
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  // Logout function
  const logout = () => {
    removeToken();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Auth context value
  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    hasRole, 
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;