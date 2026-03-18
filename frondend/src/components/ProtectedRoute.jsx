import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {Array<string>} props.allowedRoles - Optional list of roles allowed to access this route
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f8ba2b]"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login but save the current location to redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role-based authorization
    if (allowedRoles && allowedRoles.length > 0) {
        // Read role from state or fallback to localStorage
        const storedRole = localStorage.getItem('role');
        const userRole = (user?.role || storedRole || '').toLowerCase().trim();

        const hasPermission = allowedRoles.some(role => role.toLowerCase() === userRole);

        if (!hasPermission) {
            console.warn(`Access Denied: Role '${userRole}' not in allowed list [${allowedRoles}]`);

            // Redirect to appropriate dashboard based on role to avoid login loop
            if (userRole === 'admin' || userRole === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
            if (userRole === 'mentor_head') return <Navigate to="/mentor-head/dashboard" replace />;
            if (userRole === 'mentor') return <Navigate to="/mentor/dashboard" replace />;
            if (userRole === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
            if (userRole === 'student') return <Navigate to="/student/dashboard" replace />;

            return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
