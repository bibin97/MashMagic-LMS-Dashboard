import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    ClipboardList,
    CheckSquare,
    Files,
    Bell,
    User,
    LogOut,
    Settings,
    ChevronRight,
    Menu,
    X
} from 'lucide-react';
import Navbar from '../Navbar';
import toast from 'react-hot-toast';

const FacultyLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navItems = [
        { path: '/faculty/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { path: '/faculty/students', icon: <Users size={18} />, label: 'Students' },
        { path: '/faculty/sessions', icon: <Calendar size={18} />, label: 'Sessions' },
        { path: '/faculty/reports', icon: <ClipboardList size={18} />, label: 'Reports' },
        { path: '/faculty/exam-scores', icon: <CheckSquare size={18} />, label: 'Exam Scores' },
        { path: '/faculty/student-logs', icon: <ClipboardList size={18} />, label: 'Student Logs' },
        { path: '/faculty/tasks', icon: <CheckSquare size={18} />, label: 'Tasks' },
        { path: '/faculty/notifications', icon: <Bell size={18} />, label: 'Notifications' },
        { path: '/faculty/profile', icon: <Settings size={18} />, label: 'Profile' },
    ];

    const handleLogout = () => {
        logout();
        toast.success("Logout Successful");
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex font-sans overflow-hidden relative"
             style={{ background: 'linear-gradient(180deg, #F8FAFC, #EEF2F7)' }}>
             {/* Mobile Overlay */}
             {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[990] md:hidden cursor-pointer transition-all duration-500"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full w-64 flex flex-col z-[1000] shadow-2xl overflow-hidden transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                   style={{ background: 'linear-gradient(180deg, #0F172A, #020617)' }}>
                {/* Branding */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center p-1 bg-white/5 rounded-xl border border-white/10">
                            <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-xl font-black text-white tracking-tighter italic leading-none">MashMagic</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/50 hover:text-white p-2 hover:bg-white/5 rounded-xl">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
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
                            <span className="text-sm tracking-tight">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer User Profile */}
                <div className="p-4 border-t border-white/5 space-y-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-[20px] flex items-center gap-3 group hover:bg-white/10 transition-all cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#0F766E] to-[#14B8A6] rounded-[14px] flex items-center justify-center text-white shadow-lg shadow-[#14B8A6]/20 overflow-hidden">
                            {user?.profile_image ? (
                                <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={20} />
                            )}
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

            {/* Main Content Area */}
            <div className="flex-1 md:ml-64 flex flex-col min-w-0 w-full transition-all duration-300">
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="p-6 md:p-10 min-h-screen animate-in fade-in slide-in-from-bottom-8 duration-700 overflow-x-hidden w-full max-w-[100vw]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default FacultyLayout;
