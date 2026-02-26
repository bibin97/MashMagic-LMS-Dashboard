import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    LogOut,
    Bell,
    User,
    HeartHandshake,
    Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const AcademicCounselorLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/academic-counselor/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { path: '/academic-counselor/students', icon: <Users size={18} />, label: 'Students' },
        { path: '/academic-counselor/reports', icon: <Users size={18} />, label: 'Reports' },
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
                        <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-rose-500/20 rotate-3">
                            <HeartHandshake size={20} />
                        </div>
                        BDM
                    </h1>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto mt-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group
                                ${isActive
                                    ? 'bg-rose-600 text-white font-bold shadow-xl shadow-rose-600/20 -translate-y-0.5'
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
                        <div className="w-10 h-10 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex items-center justify-center text-rose-400">
                            <User size={20} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">BDM</span>
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
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight text-transform uppercase italic">BDM Dashboard</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Student Monitoring & Support Overview</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">System Online</span>
                        </div>
                        <button className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all hover:shadow-xl shadow-slate-200 group relative">
                            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                            <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
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

export default AcademicCounselorLayout;
