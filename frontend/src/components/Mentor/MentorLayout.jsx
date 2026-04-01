import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    ListTodo,
    MessageSquare,
    Contact,
    CalendarClock,
    Calendar,
    LogOut,
    User,
    GraduationCap,
    Menu,
    X
} from 'lucide-react';
import api from '../../services/api';
import Navbar from '../Navbar';
import toast from 'react-hot-toast';

const MentorLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [pendingTasksCount, setPendingTasksCount] = useState(0);
    const [pendingExamsCount, setPendingExamsCount] = useState(0);

    const fetchPendingTasks = async () => {
        try {
            const res = await api.get('/mentor/tasks');
            const pending = res.data.data.filter(t => t.status !== 'Completed').length;
            setPendingTasksCount(pending);
        } catch (error) {
            // Silent fail
        }
    };

    const fetchPendingExams = async () => {
        try {
            const res = await api.get('/mentor/exams/pending');
            setPendingExamsCount(res.data.data.length);
        } catch (error) {
            // Silent fail
        }
    };

    React.useEffect(() => {
        if (user) {
            fetchPendingTasks();
            fetchPendingExams();
            const interval = setInterval(() => {
                fetchPendingTasks();
                fetchPendingExams();
            }, 30000); // 30s
            return () => clearInterval(interval);
        }
    }, [user]);

    // Show persistent notification toast if exams are pending
    React.useEffect(() => {
        if (pendingExamsCount > 0) {
            toast(`Attention: ${pendingExamsCount} Exam Milestones are pending!`, {
                icon: '📝',
                duration: 6000,
                id: 'exam-alert' // Prevent duplicates
            });
        }
    }, [pendingExamsCount]);

    const navItems = [
        { path: '/mentor/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { path: '/mentor/students', icon: <Users size={18} />, label: 'My Students' },
        { path: '/mentor/tasks', icon: <ListTodo size={18} />, label: 'Tasks', badge: pendingTasksCount },
        { path: '/mentor/student-log', icon: <MessageSquare size={18} />, label: 'Student Logs' },
        { path: '/mentor/faculty-log', icon: <Contact size={18} />, label: 'Faculty Logs' },
        { path: '/mentor/timetable', icon: <CalendarClock size={18} />, label: 'Timetable' },
        { path: '/mentor/academic-schedule', icon: <Calendar size={18} />, label: 'Academic Schedule' },
        { path: '/mentor/exams', icon: <GraduationCap size={18} />, label: 'Exams', badge: pendingExamsCount },
    ];

    const handleLogout = () => {
        logout();
        toast.success("Logout Successful");
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex overflow-hidden relative font-sans"
             style={{ background: 'linear-gradient(180deg, #F8FAFC, #EEF2F7)' }}>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[990] md:hidden cursor-pointer transition-all duration-500"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full w-64 flex flex-col z-[1000] shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                   style={{ background: 'linear-gradient(180deg, #0F172A, #020617)' }}>
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-3 italic">
                        <div className="w-10 h-10 flex items-center justify-center p-1 bg-white/5 rounded-xl border border-white/10">
                            <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        Mentor Hub
                    </h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/50 hover:text-white p-2 hover:bg-white/5 rounded-xl">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto mt-4 custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                                ${isActive
                                    ? 'bg-[#14B8A6]/10 text-white font-bold border-l-[3px] border-[#14B8A6] shadow-[0_0_20px_rgba(20,184,166,0.1)]'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'}
                            `}
                        >
                            <span className="transition-opacity group-hover:opacity-100 opacity-70">{item.icon}</span>
                            <span className="text-sm tracking-tight flex-1">{item.label}</span>
                            {item.badge > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F59E0B] text-[9px] font-black text-black shadow-lg shadow-[#F59E0B]/20 animate-pulse">
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-[20px] flex items-center gap-3 group hover:bg-white/10 transition-all cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#0F766E] to-[#14B8A6] rounded-[14px] flex items-center justify-center text-white shadow-lg shadow-[#14B8A6]/20">
                            <User size={20} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                                {user?.role?.split('_').join(' ')}
                            </span>
                            <span className="text-xs font-bold text-slate-200 truncate">{user?.name}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-[16px] transition-all duration-300 text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 text-slate-400 hover:bg-[#EF4444] hover:text-white border border-white/10 hover:border-transparent group"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-w-0 w-full transition-all duration-300">
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="p-6 md:p-10 min-h-screen animate-in fade-in slide-in-from-bottom-8 duration-700 overflow-x-hidden w-full max-w-[100vw]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MentorLayout;
