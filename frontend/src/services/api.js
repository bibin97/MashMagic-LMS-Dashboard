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

// Response interceptor to handle 401 (Unauthorized) and 403 (Forbidden) errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle Token Expiration or Authorization issues
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn(`[AUTH ERROR] Status ${error.response.status}: Redirecting to login...`);
            
            // Clear all auth data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Avoid infinite loops if we are already on login or signup
            const publicPaths = ['/login', '/signup'];
            const currentPath = window.location.pathname;
            
            if (!publicPaths.some(path => currentPath.startsWith(path))) {
                // Use replace to prevent back-button loops
                window.location.replace('/login?expired=true');
            }
        }
        return Promise.reject(error);
    }
);
export default api;
