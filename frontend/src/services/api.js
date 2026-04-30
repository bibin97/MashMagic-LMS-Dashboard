import axios from 'axios';
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle auth expiration safely
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const isExpired = Boolean(error?.response?.data?.isExpired);
        const message = String(error?.response?.data?.message || '').toLowerCase();
        const looksLikeTokenProblem =
            message.includes('token expired') ||
            message.includes('token failed') ||
            message.includes('no token') ||
            message.includes('not authorized');

        // IMPORTANT: Do not logout on generic 403 errors.
        // Only force logout for real auth failures/expired token.
        if (status === 401 || isExpired || (status === 403 && looksLikeTokenProblem)) {
            console.warn(`[AUTH ERROR] Status ${status}: clearing auth and redirecting to login`);
            
            // Clear all auth data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            
            // Do NOT auto-refresh/auto-redirect from interceptor.
            // Let UI pages decide navigation flow explicitly.
        }
        return Promise.reject(error);
    }
);
export default api;
