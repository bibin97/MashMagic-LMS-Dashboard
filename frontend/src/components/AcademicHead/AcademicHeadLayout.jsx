import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    LogOut,
    User,
    BookOpen,
    UserPlus,
    ShieldAlert,
    Activity,
    ClipboardList,
    MessageSquare,
    Briefcase,
    GraduationCap,
    Users,
    Menu,
    X
} from 'lucide-react';
import Navbar from '../Navbar';
import toast from 'react-hot-toast';

const AcademicHeadLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navItems = [
        { path: '/academic-head/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { path: '/academic-head/actions', icon: <Activity size={18} />, label: 'Actions Center' },
        { path: '/academic-head/registrations', icon: <UserPlus size={18} />, label: 'Registrations' },
        { path: '/academic-head/students', icon: <GraduationCap size={18} />, label: 'Students' },
        { path: '/academic-head/mentors', icon: <Users size={18} />, label: 'Mentors' },
        { path: '/academic-head/faculties', icon: <Briefcase size={18} />, label: 'Faculties' },
        { path: '/academic-head/live-monitoring', icon: <Activity size={18} />, label: 'Live Monitoring' },
        { path: '/academic-head/tasks', icon: <Briefcase size={18} />, label: 'Workforce Tasks' },
        { path: '/academic-head/checking', icon: <ShieldAlert size={18} />, label: 'Institutional Audit' },
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
            <aside className={`fixed left-0 top-0 h-full w-64 bg-[#008080] flex flex-col z-[1000] shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                    <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center rotate-3 transform transition-transform hover:rotate-0 duration-500">
                            <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        Academic Head
                    </h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/70 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto mt-4 scrollbar-hide">
                    <style>{`
                        .scrollbar-hide::-webkit-scrollbar { display: none; }
                        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                    `}</style>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group
                                ${isActive
                                    ? 'bg-white/20 text-white font-bold shadow-xl -translate-y-0.5'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
                            `}
                        >
                            <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                            <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="bg-slate-800/50 p-4 rounded-3xl mb-4 border border-slate-700/50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f8ba2b]/10 rounded-2xl border border-[#f8ba2b]/20 flex items-center justify-center text-slate-900">
                            <User size={20} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Academic Head</span>
                            <span className="text-xs font-bold text-white truncate">{user?.name}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 text-[10px] font-black uppercase tracking-widest bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-lg"
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

export default AcademicHeadLayout;
