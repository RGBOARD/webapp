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
        data: response.data
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

  // Get paginated upload history
  const getPageUploadHistory = async (pageNum, pageSize = 6) => {
    try {
      const response = await axios.get('/upload_history/pagination', {
        params: {
          page: pageNum,
          size: pageSize,
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Fetch upload history error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch upload history'
      };
    }
  };

  // Toggle approval status
  const toggleapproval = async (designId, approval) => {
    try {
      await axios.put(`/design/${designId}/approval`, { approval });
      return { success: true };
    } catch (error) {
      console.error('Toggle approval error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update approval status'
      };
    }
  };

  // Logout function
  const logout = () => {
    removeToken();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const getRotationItems = async (pageNum, pageSize) => {
    try {
      const response = await axios.get('/rotation/items/pagination', {
        params: {
          page: pageNum,
          pageSize: pageSize || 6,
        },
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Fetch rotation items error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch rotation items'
      };
    }
  };
  
  // Remove an item from rotation
  const removeFromRotation = async (itemId) => {
    try {
      await axios.delete(`/rotation/item/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Remove from rotation error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to remove item'
      };
    }
  };

  const getScheduledItems = async (pageNum, pageSize) => {
    try {
      const response = await axios.get('/rotation/scheduled/pagination', {
        params: {
          page: pageNum,
          pageSize: pageSize || 6,
        },
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Fetch scheduled items error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch scheduled items'
      };
    }
  };
  
  // For removing scheduled items
  const removeScheduledItem = async (scheduleId) => {
    try {
      const response = await axios.delete(`/rotation/scheduled/${scheduleId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Remove scheduled item error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to remove scheduled item'
      };
    }
  };
  
  // Update rotation order for an item
  const updateRotationOrder = async (itemId, newOrder) => {
    try {
      await axios.put(`/rotation/${itemId}/reorder`, {new_order: newOrder});
      return {success: true};
    } catch (error) {
      console.error('Order update error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update item order'
      };
    }
  }

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
    getPageUploadHistory,
    toggleapproval,
    logout,
    hasRole, 
    hasAnyRole,
    getRotationItems, 
    removeFromRotation,
    updateRotationOrder,
    getScheduledItems,
    removeScheduledItem
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
