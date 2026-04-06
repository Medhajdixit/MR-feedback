/**
 * API Client
 * Axios instance with authentication and error handling
 */

import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance
const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            if (status === 401) {
                localStorage.removeItem('auth_token');
                toast.error('Session expired. Please login again.');
                window.location.href = '/login';
            } else if (status === 403) {
                toast.error(data.message || 'Access denied');
            } else if (status === 404) {
                toast.error('Resource not found');
            } else if (status >= 500) {
                toast.error('Server error. Please try again later.');
            } else {
                toast.error(data.error || 'An error occurred');
            }
        } else if (error.request) {
            toast.error('Network error. Please check your connection.');
        }

        return Promise.reject(error);
    }
);

// API methods
export const api = {
    auth: {
        getNonce: (address) => apiClient.post('/api/auth/nonce', { address }),
        login: (address, signature, message) =>
            apiClient.post('/api/auth/login', { address, signature, message }),
        verify: () => apiClient.get('/api/auth/verify'),
    },

    feedback: {
        submit: (data) => apiClient.post('/api/feedback', data),
        getAll: (params) => apiClient.get('/api/feedback', { params }),
        getById: (id) => apiClient.get(`/api/feedback/${id}`),
        vote: (id, support) => apiClient.post(`/api/feedback/${id}/vote`, { support }),
    },

    rating: {
        submit: (data) => apiClient.post('/api/rating', data),
        getFacultyRatings: (facultyAddress) =>
            apiClient.get(`/api/rating/faculty/${facultyAddress}`),
    },

    user: {
        getProfile: (address) => apiClient.get(`/api/user/${address}`),
        updateProfile: (data) => apiClient.put('/api/user/profile', data),
        getStats: (address) => apiClient.get(`/api/user/${address}/stats`),
        getPoints: (address) => apiClient.get(`/api/user/${address}/points`),
    },
};

export default apiClient;
