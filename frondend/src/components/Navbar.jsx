import React, { useState, useEffect } from 'react';
import { Bell, Search, User, ShieldCheck, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Navbar = () => {
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
            const res = await axios.get('http://localhost:5000/api/admin/notifications', {
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
            await axios.put(`http://localhost:5000/api/admin/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (error) {
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-[900]">
            <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl w-80 group focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all border border-transparent focus-within:border-blue-200">
                <Search size={18} className="text-slate-400 group-focus-within:text-blue-500" />
                <input
                    type="text"
                    placeholder="Global search students, mentors..."
                    className="bg-transparent border-none text-sm outline-none w-full placeholder:text-slate-400 font-medium"
                />
            </div>

            <div className="flex items-center gap-6">
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
                                        <div key={notif.id} className={`p-3 rounded-xl mb-1 flex items-start justify-between gap-3 ${notif.is_read ? 'bg-white opacity-60' : 'bg-blue-50/50'}`}>
                                            <div>
                                                <p className={`text-xs ${notif.is_read ? 'text-slate-600' : 'text-slate-900 font-bold'}`}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1 font-semibold">{new Date(notif.created_at).toLocaleString()}</p>
                                            </div>
                                            {!notif.is_read && (
                                                <button onClick={(e) => markRead(notif.id, e)} className="p-1.5 text-blue-500 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors" title="Mark as read">
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

                <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
                    <div className="text-right hidden sm:flex flex-col items-end">
                        <p className="text-sm font-black text-slate-900 leading-tight">{adminName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <ShieldCheck size={10} className="text-blue-500" />
                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Authorized Lead</p>
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
