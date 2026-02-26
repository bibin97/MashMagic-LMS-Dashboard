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
    LogOut,
    Bell,
    User,
    GraduationCap
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MentorLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

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

    const navItems = [
        { path: '/mentor/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { path: '/mentor/students', icon: <Users size={18} />, label: 'My Students' },
        { path: '/mentor/tasks', icon: <ListTodo size={18} />, label: 'Tasks', badge: pendingTasksCount },
        { path: '/mentor/student-log', icon: <MessageSquare size={18} />, label: 'Student Logs' },
        { path: '/mentor/faculty-log', icon: <Contact size={18} />, label: 'Faculty Logs' },
        { path: '/mentor/timetable', icon: <CalendarClock size={18} />, label: 'Timetable' },
        { path: '/mentor/exams', icon: <GraduationCap size={18} />, label: 'Exams', badge: pendingExamsCount },
    ];

    const handleLogout = () => {
        logout();
        toast.success("Logout Successful");
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col z-[1000] shadow-sm">
                <div className="p-8 border-b border-slate-50">
                    <h1 className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-100 rotate-3">
                            M
                        </div>
                        Mentor Hub
                    </h1>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group
                                ${isActive
                                    ? 'bg-blue-600 text-white font-bold shadow-xl shadow-blue-100 -translate-y-0.5'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}
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
                    <div className="bg-slate-50 p-4 rounded-3xl mb-4 border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                            <User size={20} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Authenticated As</span>
                            <span className="text-xs font-bold text-slate-700 truncate">{user?.name}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all duration-300 text-[10px] font-black uppercase tracking-widest"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 min-h-screen">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Performance</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">MashMagic Mentor Operational Dashboard</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all hover:shadow-lg shadow-slate-200">
                            <Bell size={18} />
                        </button>
                    </div>
                </header>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MentorLayout;
