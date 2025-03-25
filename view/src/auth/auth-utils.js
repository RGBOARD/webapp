import { useAuth0 } from '@auth0/auth0-react';
import config from "../../../frontend/src/config";

export const useUserRoles = () => {
  const { user, isAuthenticated } = useAuth0();
  
  if (!isAuthenticated || !user) {
    return []; // No roles for non-authenticated users
  }
  
  const namespace = config.apiUrl + '/';

  return user[`${namespace}roles`] || ['user']; 
};

export const hasRole = (userRoles, requiredRole) => {
  return userRoles.includes(requiredRole);
};

export const hasAnyRole = (userRoles, allowedRoles) => {
  return userRoles.some(role => allowedRoles.includes(role));
};