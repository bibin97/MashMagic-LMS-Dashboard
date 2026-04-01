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
    X
} from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/admin/admin-management', icon: <UserCheck size={20} />, label: 'Admins', superOnly: true },
        { path: '/admin/approvals', icon: <UserCheck size={20} />, label: 'Approvals' },
        { path: '/admin/students', icon: <Users size={20} />, label: 'Students' },
        { path: '/admin/mentors', icon: <UserSquare2 size={20} />, label: 'Mentors' },
        { path: '/admin/faculties', icon: <GraduationCap size={20} />, label: 'Faculties' },
        { path: '/admin/staff', icon: <UserSquare2 size={20} />, label: 'Staff Management' },
        { path: '/admin/tasks', icon: <ListTodo size={20} />, label: 'Tasks' },
        { path: '/admin/reports', icon: <FileText size={20} />, label: 'Reports' },
        { path: '/admin/live-monitoring', icon: <Target size={20} />, label: 'Live Classes' },
        { path: '/admin/mentor-head-report', icon: <Target size={20} />, label: 'Mentor Head Report' },
        { path: '/admin/logs', icon: <ScrollText size={20} />, label: 'Logs' },
    ];

    const filteredNavItems = navItems.filter(item => {
        if (item.superOnly && user?.role !== 'super_admin') return false;
        return true;
    });

    const handleLogout = () => {
        logout();
        toast.success("Successfully logged out");
        navigate('/login');
    };

    return (
        <aside className={`fixed left-0 top-0 h-full w-64 flex flex-col z-[1000] shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
               style={{ background: 'linear-gradient(180deg, #0F172A, #020617)' }}>
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h1 className="text-xl font-black text-white flex items-center gap-3 tracking-tighter italic">
                    <div className="w-10 h-10 flex items-center justify-center p-1 bg-white/5 rounded-xl border border-white/10">
                        <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    MashMagic
                </h1>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="md:hidden text-white/50 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                {filteredNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
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
    );
};

export default Sidebar;
