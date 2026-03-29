import React, { useState, useEffect } from 'react';
import { Bell, Search, User, ShieldCheck, CheckCheck, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Navbar = ({ onMenuClick }) => {
    const { user } = useAuth();
    const adminName = user?.name || "Super Admin";
    const [notifications, setNotifications] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        // Only fetch if admin
        if (user?.role === 'super_admin' || user?.role === 'admin') {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [user]);

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
                <div className="flex-1 md:flex-none flex items-center gap-3 bg-slate-100 px-3 py-2 md:px-4 md:py-2 rounded-xl max-w-full md:w-80 group focus-within:bg-white focus-within:ring-2 focus-within:ring-[#008080] transition-all border border-transparent focus-within:border-[#f8ba2b]">
                    <Search size={18} className="text-slate-400 group-focus-within:text-[#008080] shrink-0" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none text-sm outline-none w-full placeholder:text-slate-400 font-medium"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6 ml-4">
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-all group"
                    >
                        <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200 overflow-hidden z-[1000] max-h-96 flex flex-col">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Notifications</h3>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">{unreadCount} New</span>
                            </div>
                            <div className="overflow-y-auto p-2">
                                {notifications.length === 0 ? (
                                    <p className="text-xs text-center text-slate-400 py-6 font-semibold">No recent notifications</p>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif.id} className={`p-4 rounded-2xl mb-2 flex items-start gap-3 transition-all ${notif.is_read ? 'bg-white border border-slate-100 opacity-60' : 'bg-[#008080]/10/50 border border-[#f8ba2b]/50 shadow-sm'}`}>
                                            <div className="flex-1">
                                                <div 
                                                    className={`text-[11px] leading-relaxed ${notif.is_read ? 'text-slate-600 font-medium' : 'text-slate-900 font-semibold'}`}
                                                    dangerouslySetInnerHTML={{ __html: notif.message }}
                                                />
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-[9px] text-slate-300 font-black">•</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">
                                                        {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                            {!notif.is_read && (
                                                <button 
                                                    onClick={(e) => markRead(notif.id, e)} 
                                                    className="shrink-0 p-2 text-slate-900 bg-white border border-[#f8ba2b] hover:bg-[#f8ba2b] hover:text-slate-900 rounded-xl shadow-sm transition-all" 
                                                    title="Mark as read"
                                                >
                                                    <CheckCheck size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 md:gap-4 md:pl-6 md:border-l border-slate-200">
                    <div className="text-right hidden sm:flex flex-col items-end">
                        <p className="text-sm font-black text-slate-900 leading-tight">{adminName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <ShieldCheck size={10} className="text-[#008080]" />
                            <p className="text-[10px] text-[#008080] font-black uppercase tracking-widest">Authorized Lead</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white border border-slate-800 shadow-lg shadow-slate-200 overflow-hidden hover:scale-105 transition-transform cursor-pointer">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
