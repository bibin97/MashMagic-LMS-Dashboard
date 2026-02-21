import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const AdminLayout = () => {
    // Basic authentication check (placeholder)
    const isAuthenticated = !!localStorage.getItem('token');

    // if (!isAuthenticated) {
    //   return <Navigate to="/login" replace />;
    // }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="ml-64 flex-1 flex flex-col min-w-0">
                <Navbar />
                <main className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
