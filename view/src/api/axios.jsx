import axios from 'axios';
import { getToken, removeToken } from '../auth/jwtUtils';

const instance = axios.create({
    baseURL: "http://192.168.0.19:5000"
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