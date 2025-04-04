import axios from 'axios';
import { getToken, removeToken } from '../auth/jwtUtils';

const API_URL = `http://${window.location.hostname}:5000`; // Bye bye static ip

const instance = axios.create({
    baseURL: API_URL
});

// Request interceptor to add JWT token to headers
instance.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle authentication errors
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            removeToken();
            // Redirect to login page
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default instance;