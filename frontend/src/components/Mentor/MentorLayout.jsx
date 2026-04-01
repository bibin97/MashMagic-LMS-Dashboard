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
        <div className="min-h-screen bg-slate-50 flex overflow-hidden relative">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[990] md:hidden cursor-pointer"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full w-64 bg-[#008080] flex flex-col z-[1000] shadow-2xl text-white transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center rotate-3 transform transition-transform hover:rotate-0 duration-500">
                            <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        Mentor Hub
                    </h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/70 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto mt-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group
                                ${isActive
                                    ? 'bg-[#f8ba2b] text-black font-black shadow-xl shadow-black/10 -translate-y-0.5'
                                    : 'text-white/60 hover:bg-white/10 hover:text-white'}
                            `}
                        >
                            <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                            <span className="text-xs font-black uppercase tracking-wider flex-1">{item.label}</span>
                            {item.badge > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-lg shadow-rose-100 animate-pulse">
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-50">
                    <div className="bg-[#f8ba2b] p-4 rounded-3xl mb-4 border border-[#f8ba2b]/20 shadow-lg shadow-black/10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#008080] rounded-2xl flex items-center justify-center text-white shadow-sm">
                            <User size={20} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-none mb-1">
                                {user?.role?.split('_').join(' ')}
                            </span>
                            <span className="text-xs font-black text-black truncate italic">{user?.name}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 text-[10px] font-black uppercase tracking-[0.2em] bg-[#f8ba2b] text-black hover:bg-yellow-500 shadow-xl shadow-black/10 border border-yellow-300"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-w-0 w-full transition-all duration-300">
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="p-4 md:p-8 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-x-hidden w-full max-w-[100vw]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MentorLayout;
