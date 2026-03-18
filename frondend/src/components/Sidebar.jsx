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
    ScrollText,
    UserCheck,
    Target
} from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = () => {
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
        <aside className="fixed left-0 top-0 h-full w-64 bg-[#008080] flex flex-col z-[1000] shadow-2xl">
            <div className="p-6 border-b border-slate-100">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <div className="w-12 h-12 flex items-center justify-center">
                        <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    MashMagic
                </h1>
            </div>

            <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                {filteredNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${isActive
                                ? 'bg-[#f8ba2b] text-white font-semibold shadow-lg shadow-[#f8ba2b]/30 backdrop-blur-md'
                                : 'text-white/60 hover:bg-white/10 hover:text-white'}
                        `}
                    >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-black uppercase tracking-wider bg-[#f8ba2b] text-slate-900 hover:brightness-110 shadow-lg"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
