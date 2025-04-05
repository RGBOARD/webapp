 // Store token in localStorage
 export const setToken = (token) => {
    localStorage.setItem('jwt_token', token);
  };
  
  // Retrieve token from localStorage
  export const getToken = () => {
    return localStorage.getItem('jwt_token');
  };
  
  // Remove token from localStorage
  export const removeToken = () => {
    localStorage.removeItem('jwt_token');
  };
  
  // Check if the token exists
  export const hasToken = () => {
    return !!getToken();
  };
  
  // Decode the JWT token (without validation)
  export const decodeToken = (token) => {
    if (!token) return null;
    
    try {
      // JWT format is: header.payload.signature
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Get user info from token
  export const getUserFromToken = () => {
    const token = getToken();
    if (!token) return null;
    
    const decoded = decodeToken(token);
    
    if (!decoded) return null;
    
    // The Flask-JWT-Extended typically uses 'sub' for the subject (username)
    // but we'll check for common user identifier fields
    return {
      ...decoded,
      username: decoded.name || decoded.username || decoded.sub || decoded.identity,
      user_id: decoded.user_id || decoded.id
    };
  };
  
  // Check if token is expired
  export const isTokenExpired = () => {
    const token = getToken();
    if (!token) return true;
    
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    // exp is in seconds, Date.now() is in milliseconds
    return decoded.exp * 1000 < Date.now();
  };
  
  // Check if the user has a specific role
  export const hasRole = (role) => {
    const user = getUserFromToken();
    if (!user) return false;
    
    if (role === 'admin') {
      return user.is_admin === true || 
             user.role === 'admin' || 
             (user.roles && user.roles.includes('admin'));
    }
    
    if (role === 'user') {
      return true; // All authenticated users have user role
    }
    
    return false;
  };
  
  // Check if the user has any of the specified roles
  export const hasAnyRole = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    
    return allowedRoles.some(role => hasRole(role));
  };