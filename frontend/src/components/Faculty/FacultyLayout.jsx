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
        <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden relative">
             {/* Mobile Overlay */}
             {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[990] md:hidden cursor-pointer"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full w-72 bg-[#008080] flex flex-col z-[1000] shadow-2xl overflow-hidden transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {/* Branding */}
                <div className="p-8 border-b border-slate-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg shadow-black/10 rotate-6 transform transition-transform hover:rotate-0 duration-500 overflow-hidden p-2">
                            <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tighter italic">MashMagic</h1>
                            <p className="text-[10px] font-black text-[#008080] uppercase tracking-[0.2em]">Faculty Panel</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/70 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) => `
                                flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-500 group
                                ${isActive
                                    ? 'bg-[#f8ba2b] text-black font-black shadow-xl shadow-black/10 -translate-y-0.5'
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
                    <div className="bg-[#f8ba2b] rounded-[2.5rem] p-5 border border-[#f8ba2b]/20 shadow-lg shadow-black/10 transition-all duration-500 group">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 bg-[#008080] rounded-2xl shadow-inner flex items-center justify-center text-white overflow-hidden">
                                    {user?.profile_image ? (
                                        <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#f8ba2b] rounded-full shadow-sm"></div>
                            </div>
                            <div className="flex flex-col min-w-0 pr-2">
                                <span className="text-[10px] font-black text-black/40 uppercase tracking-widest truncate leading-none mb-1">
                                    {user?.role?.split('_').join(' ')}
                                </span>
                                <span className="text-xs font-black text-black truncate italic">{user?.name}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl transition-all duration-500 text-[10px] font-black uppercase tracking-[0.2em] bg-[#f8ba2b] text-black hover:bg-yellow-500 border border-yellow-300 shadow-xl shadow-black/10"
                        >
                            <LogOut size={14} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 md:ml-72 flex flex-col min-w-0 w-full">
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="p-4 md:p-8 min-h-screen animate-in fade-in slide-in-from-bottom-6 duration-1000 overflow-x-hidden w-full max-w-[100vw]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default FacultyLayout;
