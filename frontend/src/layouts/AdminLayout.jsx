import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isAuthenticated = !!localStorage.getItem('token');

    return (
        <div className="flex min-h-screen relative overflow-hidden" 
             style={{ background: 'linear-gradient(180deg, #F8FAFC, #EEF2F7)' }}>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[990] md:hidden cursor-pointer transition-all duration-500"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            <div className="md:ml-64 flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700 overflow-x-hidden w-full max-w-[100vw]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
