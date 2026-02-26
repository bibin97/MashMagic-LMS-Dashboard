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
    ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const FacultyLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

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
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-72 bg-slate-900 flex flex-col z-[1000] shadow-2xl overflow-hidden">
                {/* Branding */}
                <div className="p-8 border-b border-slate-800/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 rotate-6 transform transition-transform hover:rotate-0 duration-500">
                            <span className="text-2xl font-black">M</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tighter italic">MashMagic</h1>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Faculty Panel</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-500 group
                                ${isActive
                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-xl shadow-indigo-600/20 -translate-y-0.5'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="flex items-center gap-4">
                                        <span className={`transition-transform duration-500 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                                            {item.icon}
                                        </span>
                                        <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
                                    </div>
                                    <ChevronRight size={14} className={`opacity-0 -translate-x-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0 ${isActive ? 'opacity-100 translate-x-0' : ''}`} />
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer User Profile */}
                <div className="p-6 mt-auto">
                    <div className="bg-slate-800/40 backdrop-blur-md rounded-[2.5rem] p-5 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-500 group">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 bg-slate-700 rounded-2xl border-2 border-slate-600 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500 transition-colors duration-500 overflow-hidden">
                                    {user?.profile_image ? (
                                        <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-800 rounded-full shadow-sm"></div>
                            </div>
                            <div className="flex flex-col min-w-0 pr-2">
                                <span className="text-xs font-black text-white truncate">{user?.name}</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">Faculty Member</span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all duration-500 text-[10px] font-black uppercase tracking-widest shadow-sm"
                        >
                            <LogOut size={14} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-72 min-h-screen relative overflow-x-hidden">
                {/* Dynamic Background Elements */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/5 rounded-full blur-[100px]"></div>
                </div>

                {/* Navbar */}
                <header className="sticky top-0 z-[900] bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/50 px-8 py-6 flex justify-between items-center transition-all duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Control Center</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">MashMagic University Management</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Search or Quick Info could go here */}
                        <div className="hidden lg:flex items-center gap-8 px-8 border-x border-slate-200/50">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Role Access</p>
                                <p className="text-xs font-bold text-slate-700 mt-1">Authorized Faculty</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">System Status</p>
                                <p className="text-xs font-bold text-emerald-500 mt-1">Operational</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="relative w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/10 group">
                                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                            </button>
                            <button
                                onClick={() => navigate('/faculty/profile')}
                                className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/10 group overflow-hidden"
                            >
                                {user?.profile_image ? (
                                    <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="group-hover:scale-110 transition-transform" />
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default FacultyLayout;
