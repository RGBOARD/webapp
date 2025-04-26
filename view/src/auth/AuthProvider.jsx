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

  // Design Upload function
  const upload = async (formData) => {
    try {
      const response = await axios.post('/design', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Upload error:', error);
      
      // If unauthorized, logout user
      if (error.response && error.response.status === 401) {
        logout();
      }
      
      return {
        success: false,
        error: error.response?.data?.error || 'Upload failed'
      };
    }
  };

  // Get paginated users (admin only)
  const getpageusers = async (pageNum, pageSize) => {
    try {
      const response = await axios.get('/user/pagination', {
        params: {
          page: pageNum,
          pageSize: pageSize,
        },
      });
      return {
        success: true,
        data: response.data // Make sure you return 'data' to match what you're trying to access in the component
      };
    } catch (error) {
      console.error('Fetch users error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch users'
      };
    }
  };

  // Delete a user by ID
  const deleteuser = async (userId) => {
    try {
      await axios.delete(`/user/${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete user'
      };
    }
  };

  // Toggle admin status
  const toggleadmin = async (userId, is_admin) => {
    try {
      await axios.put(`/user/${userId}`, { is_admin });
      return { success: true };
    } catch (error) {
      console.error('Toggle admin error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update admin status'
      };
    }
  };

    // Get paginated users (admin only)
  const getpageimages = async (pageNum, pageSize) => {
    try {
      const response = await axios.get('/queue_item/pagination', {
        params: {
          page: pageNum,
          pageSize: pageSize,
        },
      });
      return {
        success: true,
        data: response.data // Make sure you return 'data' to match what you're trying to access in the component
      };
    } catch (error) {
      console.error('Fetch users error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch users'
      };
    }
  };

    // Toggle approval status
  const toggleapproval = async (designId, approval) => {
    try {
      await axios.put(`/design/${designId}/approval`, { approval });
      return { success: true };
    } catch (error) {
      console.error('Toggle admin error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update admin status'
      };
    }
  };
  // Update order of queue item
  const updateorder = async (queueId, newOrder)  => {
    try {
      await axios.put(`/queue_item/${queueId}/order`, { new_order: newOrder });
      return { success: true };
    } catch (error) {
      console.error('Order update error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update admin status'
      };
    }
  };

  const deletequeueitem = async (queueId) => {
    try {
      await axios.delete(`/queue_item/${queueId}`);
      return { success: true };
    } catch (error) {
      console.error('Delete design error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete user'
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
    upload,
    getpageusers,
    deleteuser,
    toggleadmin,
    getpageimages,
    toggleapproval,
    updateorder,
    deletequeueitem,
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