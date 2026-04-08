import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    UserSquare2,
    GraduationCap,
    ListTodo,
    FileText,
    LogOut,
    User,
    ScrollText,
    UserCheck,
    Target,
    X,
    Activity,
    ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const sections = [
        {
            title: 'Core Panel',
            items: [
                { path: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Overview' },
                { path: '/admin/admin-management', icon: <ShieldCheck size={18} />, label: 'Admins', superOnly: true },
                { path: '/admin/approvals', icon: <UserCheck size={18} />, label: 'Gatekeeper' }
            ]
        },
        {
            title: 'Academic Hub',
            items: [
                { path: '/admin/students', icon: <Users size={18} />, label: 'Students' },
                { path: '/admin/mentors', icon: <UserSquare2 size={18} />, label: 'Mentors' },
                { path: '/admin/faculties', icon: <GraduationCap size={18} />, label: 'Faculties' },
                { path: '/admin/staff', icon: <UserSquare2 size={18} />, label: 'Staff' }
            ]
        },
        {
            title: 'Performance',
            items: [
                { path: '/admin/tasks', icon: <ListTodo size={18} />, label: 'Tasks' },
                { path: '/admin/reports', icon: <FileText size={18} />, label: 'Reports' },
                { path: '/admin/live-monitoring', icon: <Activity size={18} />, label: 'Live Monitoring' },
                { path: '/admin/mentor-head-report', icon: <Target size={18} />, label: 'Metrics' }
            ]
        }
    ];

    const handleLogout = () => {
        logout();
        toast.success("Successfully logged out");
        navigate('/login');
    };

    return (
        <aside className={`fixed left-0 top-0 h-full w-64 flex flex-col z-[1000] shadow-2xl transition-transform duration-500 ease-out md:translate-x-0 premium-sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center p-2 bg-gradient-to-br from-teal-400/20 to-teal-600/20 rounded-xl border border-teal-500/20 glow-teal">
                        <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain filter brightness-125" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white tracking-widest uppercase">MashMagic</h1>
                        <p className="text-[8px] text-teal-500 font-black tracking-[0.3em] uppercase leading-none mt-1">LMS Platform</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="md:hidden text-white/50 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all"
                >
                    <X size={24} />
                </button>
            </div>

            <nav className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar pt-10">
                {sections.map((section, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                        <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{section.title}</h3>
                        {section.items.map((item) => {
                            if (item.superOnly && user?.role !== 'super_admin') return null;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group nav-active-glow relative
                                        ${isActive
                                            ? 'bg-teal-500/10 text-white font-bold border-l-[3px] border-teal-500 shadow-[20px_0_40px_rgba(20,184,166,0.05)]'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'}
                                    `}
                                >
                                    <span className={`transition-all duration-300 group-hover:scale-110 group-hover:text-teal-400`}>
                                        {item.icon}
                                    </span>
                                    <span className="text-sm tracking-tight">{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="p-6 border-t border-white/5 space-y-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 group hover:bg-white/10 transition-all cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center text-white border border-white/10 group-hover:border-teal-500/50 transition-colors">
                        <User size={18} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest leading-none mb-1">
                            {user?.role?.split('_').join(' ')}
                        </span>
                        <span className="text-xs font-bold text-slate-200 truncate">{user?.name}</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-[10px] font-black uppercase tracking-[0.2em] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-transparent group"
                >
                    <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Terminate Session</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
