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
        <aside className={`fixed left-0 top-0 h-full w-64 bg-[#008080] flex flex-col z-[1000] shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 md:p-6 border-b border-slate-100/20 flex items-center justify-between">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                        <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    MashMagic
                </h1>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="md:hidden text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
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
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                            ${isActive
                                ? 'bg-[#f8ba2b] text-black font-black shadow-xl shadow-black/10 -translate-y-0.5'
                                : 'text-white/60 hover:bg-white/10 hover:text-white'}
                        `}
                    >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-700/50">
                <div className="bg-[#f8ba2b] p-4 rounded-3xl mb-4 border border-[#f8ba2b]/20 shadow-lg shadow-black/10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#008080] rounded-2xl flex items-center justify-center text-white shadow-inner">
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
    );
};

export default Sidebar;
