import React, { useState, useEffect } from 'react';
import { Bell, Search, User, ShieldCheck, CheckCheck, Menu, LogOut, Settings, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Navbar = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const adminName = user?.name || "Super Admin";
    const [notifications, setNotifications] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // Auto-close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen || isUserMenuOpen) {
                // If the click is not on a dropdown or a button that opens a dropdown
                if (!event.target.closest('.dropdown-container')) {
                    setIsDropdownOpen(false);
                    setIsUserMenuOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen, isUserMenuOpen]);

    useEffect(() => {
        // Only fetch admin notifications if user is admin or super_admin
        const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
        
        if (user && isAdmin) {
            fetchNotifications();
            // Faster polling for 'at the spot' feel (3s)
            const interval = setInterval(fetchNotifications, 3000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Cleanup: Export refetch function to window for 'spot' updates from other components
    useEffect(() => {
        window.refetchNotifications = fetchNotifications;
        return () => { delete window.refetchNotifications; };
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/admin/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setNotifications(res.data.data);
            }
        } catch (e) {
        }
    };

    const markRead = async (id, e) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/admin/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (error) {
        }
    };

    const deleteNotification = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/admin/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
        }
    };

    const clearAllNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete('/api/admin/notifications/clear-all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications([]);
        } catch (error) {
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleProfileClick = () => {
        setIsUserMenuOpen(false);
        const rolePaths = {
            'super_admin': '/admin/profile',
            'admin': '/admin/profile',
            'mentor_head': '/mentor-head/profile',
            'academic_head': '/academic-head/profile',
            'mentor': '/mentor/profile',
            'faculty': '/faculty/profile'
        };

        const path = rolePaths[user?.role];
        if (path) {
            navigate(path);
        } else {
            toast.error('Profile route not defined for this role');
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-[900]">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                    onClick={onMenuClick}
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors mr-1"
                >
                    <Menu size={20} />
                </button>
                <div className="flex-1 md:flex-none flex items-center gap-3 bg-slate-100 px-3 py-2 md:px-4 md:py-2 rounded-xl max-w-full md:w-80 group focus-within:bg-white focus-within:ring-2 focus-within:ring-[#008080] transition-all border border-transparent focus-within:border-[#008080]">
                    <Search size={18} className="text-slate-400 group-focus-within:text-[#008080] shrink-0" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none text-sm outline-none w-full placeholder:text-slate-400 font-medium"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6 ml-4">
                <div className="relative dropdown-container">
                    <button
                        onClick={() => {
                            setIsDropdownOpen(!isDropdownOpen);
                            setIsUserMenuOpen(false);
                        }}
                        className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-all group"
                    >
                        <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div className="fixed inset-x-4 top-20 md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 md:w-[400px] bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xl shadow-[#008080]/10 overflow-hidden z-[1000] max-h-[calc(100vh-120px)] md:max-h-[500px] flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                            <div className="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 tracking-tight">Activity Feed</h3>
                                    <p className="text-[10px] text-slate-500 font-medium">Real-time platform updates</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {notifications.length > 0 && (
                                        <button 
                                            onClick={clearAllNotifications}
                                            className="text-[10px] font-black text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors uppercase tracking-tight"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                    <span className="text-[10px] font-bold text-[#008080] bg-[#008080]/10 px-2.5 py-1 rounded-full">{unreadCount} New</span>
                                </div>
                            </div>
                            
                            <div className="overflow-y-auto p-3 space-y-2 max-h-[400px] flex-grow custom-scrollbar overscroll-contain">
                                {notifications.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center opacity-40">
                                        <Bell size={40} className="text-slate-300 mb-4" />
                                        <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase">Pipeline Clean</p>
                                    </div>
                                ) : (
                                    notifications.map((notif, idx) => (
                                        <div 
                                            key={notif.id} 
                                            className={`group relative p-4 rounded-2xl transition-all duration-300 border ${
                                                notif.is_read 
                                                    ? 'bg-white/50 border-slate-100 opacity-60 hover:opacity-100' 
                                                    : 'bg-gradient-to-br from-[#008080]/10 to-[#008080]/5 border-[#008080]/20 shadow-sm hover:shadow-md hover:border-[#008080]/40'
                                            }`}
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                    notif.is_read ? 'bg-slate-100 text-slate-400' : 'bg-white text-[#008080] shadow-sm'
                                                }`}>
                                                    <Bell size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div 
                                                        className={`text-[12px] leading-relaxed break-words ${notif.is_read ? 'text-slate-600 font-medium' : 'text-slate-900 font-bold'}`}
                                                        dangerouslySetInnerHTML={{ __html: notif.message }}
                                                    />
                                                    <div className="flex items-center gap-2 mt-2.5">
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                                            <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                            {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notif.is_read && (
                                                        <button 
                                                            onClick={(e) => markRead(notif.id, e)} 
                                                            className="p-1.5 bg-white text-[#008080] border border-[#008080]/20 hover:bg-[#008080] hover:text-white rounded-lg shadow-sm transition-all duration-300"
                                                            title="Mark read"
                                                        >
                                                            <CheckCheck size={14} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={(e) => deleteNotification(notif.id, e)}
                                                        className="p-1.5 bg-white text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white rounded-lg shadow-sm transition-all duration-300"
                                                        title="Delete"
                                                    >
                                                        <ShieldCheck className="rotate-45" size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center shrink-0">
                                <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#008080] transition-all">Audit Archive</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 md:gap-4 md:pl-6 md:border-l border-slate-200 relative dropdown-container">
                    <div className="text-right hidden sm:flex flex-col items-end">
                        <p className="text-sm font-black text-slate-900 leading-tight tracking-tight">{adminName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <ShieldCheck size={10} className="text-[#008080]" />
                            <p className="text-[10px] text-[#008080] font-black uppercase tracking-widest">Authorized Lead</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setIsUserMenuOpen(!isUserMenuOpen);
                            setIsDropdownOpen(false);
                        }}
                        className="w-10 h-10 bg-[#008080] rounded-xl flex items-center justify-center text-white border border-[#008080]/30 shadow-xl shadow-[#008080]/10 overflow-hidden hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-transparent hover:ring-[#008080]/20"
                    >
                        <User size={20} />
                    </button>

                    {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-4 w-56 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden z-[1000] animate-in fade-in slide-in-from-top-2">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Active Session</p>
                                <p className="text-sm font-bold text-slate-900 truncate">{user?.email}</p>
                            </div>
                            <div className="p-2">
                                <button 
                                    onClick={handleProfileClick}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#008080] rounded-xl transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#008080]/10 transition-colors">
                                        <User size={16} />
                                    </div>
                                    Profile Settings
                                </button>
                                <button 
                                    onClick={handleProfileClick}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#008080] rounded-xl transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#008080]/10 transition-colors">
                                        <Settings size={16} />
                                    </div>
                                    Security
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#008080] rounded-xl transition-all group">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#008080]/10 transition-colors">
                                        <HelpCircle size={16} />
                                    </div>
                                    Support
                                </button>
                                <div className="my-2 border-t border-slate-100"></div>
                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black text-white bg-[#008080] hover:bg-[#008080]/90 rounded-xl transition-all group shadow-lg shadow-[#008080]/10"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#f8ba2b] flex items-center justify-center transition-colors text-black">
                                        <LogOut size={16} />
                                    </div>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
