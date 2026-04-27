import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';
import { 
    LayoutDashboard, 
    Target, 
    ShieldCheck, 
    UserPlus, 
    Users, 
    GraduationCap, 
    Briefcase, 
    ListTodo, 
    CheckCircle2, 
    Activity 
} from 'lucide-react';

const MentorHeadLayout = () => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navItems = [
        { path: '/mentor-head/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { path: '/mentor-head/checks', icon: <Target className="w-[18px] h-[18px]" />, label: 'Student Checks' },
        { path: '/mentor-head/shift', icon: <ShieldCheck className="w-[18px] h-[18px]" />, label: 'Student Shift' },
        { path: '/mentor-head/register-mentor', icon: <UserPlus size={18} />, label: 'Register Mentor' },
        { path: '/mentor-head/mentors', icon: <Users size={18} />, label: 'Mentors List' },
        { path: '/mentor-head/students', icon: <GraduationCap size={18} />, label: 'Students' },
        { path: '/mentor-head/faculties', icon: <Briefcase size={18} />, label: 'Faculties' },
        { path: '/mentor-head/tasks', icon: <ListTodo size={18} />, label: 'Tasks' },
        { path: '/mentor-head/course-completed', icon: <CheckCircle2 size={18} />, label: 'Course Completed' },
        { path: '/mentor-head/interactions', icon: <Activity size={18} />, label: 'Logs' },
    ];

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
                title="Mentor Head"
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

export default MentorHeadLayout;
