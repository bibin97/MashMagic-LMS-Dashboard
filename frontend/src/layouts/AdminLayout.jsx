import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
    LayoutDashboard, 
    UserCheck, 
    Users, 
    UserSquare2, 
    GraduationCap, 
    ListTodo, 
    FileText, 
    Target, 
    ScrollText 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navItems = [
        { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', perm: 'dashboard' },
        { path: '/admin/admin-management', icon: <UserCheck size={20} />, label: 'Sub Admins', perm: 'admins' },
        { path: '/admin/approvals', icon: <UserCheck size={20} />, label: 'Approvals', perm: 'approvals' },
        { path: '/admin/students', icon: <Users size={20} />, label: 'Students', perm: 'students' },
        { path: '/admin/mentors', icon: <UserSquare2 size={20} />, label: 'Mentors', perm: 'mentors' },
        { path: '/admin/faculties', icon: <GraduationCap size={20} />, label: 'Faculties', perm: 'faculties' },
        { path: '/admin/staff', icon: <UserSquare2 size={20} />, label: 'Staff Management', perm: 'staff' },
        { path: '/admin/tasks', icon: <ListTodo size={20} />, label: 'Tasks', perm: 'tasks' },
        { path: '/admin/reports', icon: <FileText size={20} />, label: 'Reports', perm: 'reports' },
        { path: '/admin/live-monitoring', icon: <Target size={20} />, label: 'Live Classes', perm: 'monitoring' },
        { path: '/admin/mentor-head-report', icon: <Target size={20} />, label: 'Mentor Head Report', perm: 'reports' },
        { path: '/admin/logs', icon: <ScrollText size={20} />, label: 'Logs', perm: 'logs' },
    ].filter(item => {
        // Main Admin has full access
        if (user?.role === 'super_admin') return true;
        
        // Sub Admins filtered by granular permissions
        if (user?.role === 'sub_admin') {
            const perms = user?.permissions || {};
            if (item.perm) return !!perms[item.perm];
            return true;
        }
        
        return false;
    });

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
            
            <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
                isCollapsed={isCollapsed} 
                setIsCollapsed={setIsCollapsed} 
                navItems={navItems}
                title="Admin Panel"
            />
            
            <div className={`flex-1 flex flex-col min-w-0 w-full h-screen overflow-y-auto transition-all duration-300 ${isCollapsed ? 'md:ml-24' : 'md:ml-72'}`}>
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="p-6 md:p-10 overflow-x-hidden w-full max-w-[100vw]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.98 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
