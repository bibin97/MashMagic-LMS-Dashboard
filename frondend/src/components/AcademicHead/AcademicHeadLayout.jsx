import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    LogOut,
    Bell,
    User,
    BookOpen,
    UserPlus,
    ShieldAlert,
    Activity,
    ClipboardList,
    MessageSquare,
    Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

const AcademicHeadLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/academic-head/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { path: '/academic-head/actions', icon: <Activity size={18} />, label: 'Actions Center' },
        { path: '/academic-head/registrations', icon: <UserPlus size={18} />, label: 'Registrations' },
        { path: '/academic-head/tasks', icon: <Briefcase size={18} />, label: 'Workforce Tasks' },
        { path: '/academic-head/faculty-activity', icon: <ClipboardList size={18} />, label: 'Academic Reports' },
        { path: '/academic-head/student-logs', icon: <MessageSquare size={18} />, label: 'Student Interactions' },
        { path: '/academic-head/faculty-logs', icon: <Briefcase size={18} />, label: 'Staff Intake Logs' },
        { path: '/academic-head/checking', icon: <ShieldAlert size={18} />, label: 'Institutional Audit' },
    ];

    const handleLogout = () => {
        logout();
        toast.success("Logout Successful");
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 flex flex-col z-[1000] shadow-2xl">
                <div className="p-8 border-b border-slate-800">
                    <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 rotate-3">
                            <BookOpen size={20} />
                        </div>
                        Academic Head
                    </h1>
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
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group
                                ${isActive
                                    ? 'bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-600/20 -translate-y-0.5'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                            `}
                        >
                            <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                            <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="bg-slate-800/50 p-4 rounded-3xl mb-4 border border-slate-700/50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <User size={20} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Academic Head</span>
                            <span className="text-xs font-bold text-white truncate">{user?.name}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-4 text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all duration-300 text-[10px] font-black uppercase tracking-widest"
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
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Academic Engine</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">MashMagic Academic Performance Tracking</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right mr-4 hidden md:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
                            <p className="text-xs font-bold text-emerald-500">System Online</p>
                        </div>
                        <button className="w-10 h-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:shadow-lg shadow-slate-200">
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

export default AcademicHeadLayout;
