import React, { useState, useEffect } from 'react';
import { Bell, Search, User, ShieldCheck, CheckCheck, Menu, LogOut, Settings, HelpCircle, Plus, Command, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Navbar = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 17) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    // Auto-close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen || isUserMenuOpen) {
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
        const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
        if (user && isAdmin) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 5000);
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
        } catch (e) {}
    };

    const markRead = async (id, e) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/admin/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (error) {}
    };

    const deleteNotification = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/admin/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {}
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleProfileClick = () => {
        setIsUserMenuOpen(false);
        navigate('/admin/profile');
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <header className="h-24 bg-white/40 backdrop-blur-2xl border-b border-white/50 flex items-center justify-between px-10 sticky top-0 z-[900] shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-10">
                <button 
                    onClick={onMenuClick}
                    className="md:hidden p-3 text-slate-600 hover:bg-white/60 rounded-2xl transition-all active:scale-95 shadow-sm border border-white/40"
                >
                    <Menu size={22} />
                </button>
                
                <div className="hidden lg:flex flex-col">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        {greeting}, {user?.name?.split(' ')[0]} <span className="animate-bounce">👋</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <Sparkles size={12} className="text-teal-500 fill-teal-500" />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Operational Console: Stable</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-3 bg-white/60 px-6 py-3.5 rounded-2xl w-96 group focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/5 transition-all border border-white/60 focus-within:border-teal-500/30 shadow-sm">
                    <Search size={18} className="text-slate-400 group-focus-within:text-teal-500 shrink-0 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search workspace..."
                        className="bg-transparent border-none text-sm outline-none w-full placeholder:text-slate-400 font-medium"
                    />
                    <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                        <Command size={10} className="text-slate-400" />
                        <span className="text-[9px] font-black text-slate-400">K</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button 
                    onClick={() => navigate('/admin/students')}
                    className="hidden sm:flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-teal-500/20 hover:shadow-teal-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-teal-400/20"
                >
                    <Plus size={16} />
                    <span>Quick Enrollment</span>
                </button>

                <div className="h-10 w-[1px] bg-slate-200/60 hidden md:block mx-2"></div>

                <div className="relative dropdown-container">
                    <button
                        onClick={() => {
                            setIsDropdownOpen(!isDropdownOpen);
                            setIsUserMenuOpen(false);
                        }}
                        className={`relative p-3.5 rounded-2xl transition-all group border ${
                            isDropdownOpen ? 'bg-white border-teal-500/20 shadow-lg ring-4 ring-teal-500/5' : 'bg-white/60 border-white/60 hover:bg-white hover:border-teal-500/20 shadow-sm'
                        }`}
                    >
                        <Bell size={20} className={`transition-all ${isDropdownOpen ? 'text-teal-500' : 'text-slate-500 group-hover:text-teal-500 group-hover:rotate-12'}`} />
                        {unreadCount > 0 && (
                            <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-6 w-96 bg-white/95 backdrop-blur-3xl border border-white/50 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden z-[1000] p-6 animate-in fade-in slide-in-from-top-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-black text-slate-900 tracking-tight">Intelligence Hub</h3>
                                <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full">{unreadCount} New Signals</span>
                            </div>
                            
                            <div className="overflow-y-auto max-h-[400px] space-y-3 pr-2 custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <Bell size={32} className="text-slate-200 mx-auto mb-4" />
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Awaiting Transmissions</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className="p-4 bg-slate-50/50 hover:bg-white border border-transparent hover:border-teal-500/10 rounded-2xl transition-all cursor-pointer group relative">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm transition-transform group-hover:scale-105 shrink-0">
                                                    <Sparkles size={16} className="text-teal-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-slate-800 leading-relaxed mb-2 pr-6" dangerouslySetInnerHTML={{ __html: notif.message }} />
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Signal Intercepted
                                                    </p>
                                                </div>
                                            </div>
                                            {!notif.is_read && <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-teal-500 rounded-full"></span>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative dropdown-container">
                    <button 
                        onClick={() => {
                            setIsUserMenuOpen(!isUserMenuOpen);
                            setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 p-1.5 pr-4 bg-white/60 hover:bg-white border border-white/60 hover:border-teal-500/20 rounded-2xl transition-all active:scale-95 group shadow-sm"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-950 rounded-xl flex items-center justify-center text-white border border-white/20 shadow-lg shadow-slate-900/10 group-hover:scale-105 transition-transform overflow-hidden">
                            <User size={20} />
                        </div>
                        <div className="text-left hidden lg:block">
                            <p className="text-[11px] font-black text-slate-900 tracking-tight leading-none mb-1">{user?.name?.split(' ')[0]}</p>
                            <p className="text-[9px] text-teal-600 font-black uppercase tracking-widest leading-none">Console Root</p>
                        </div>
                    </button>

                    {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-6 w-72 bg-white/95 backdrop-blur-3xl border border-white/50 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden z-[1000] p-3 animate-in fade-in slide-in-from-top-4">
                            <div className="p-5 bg-slate-50/80 rounded-2xl mb-2">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 leading-none">Session Status</p>
                                <p className="text-sm font-black text-slate-900 truncate tracking-tight mb-3 italic">mashmagic.internal</p>
                                <div className="flex items-center gap-2 px-2 py-1 bg-teal-500/10 rounded-lg w-fit">
                                    <ShieldCheck size={10} className="text-teal-600" />
                                    <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">Identity Verified</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <button onClick={handleProfileClick} className="w-full flex items-center gap-3.5 px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-teal-600 rounded-xl transition-all group">
                                    <User size={16} className="group-hover:scale-110 transition-transform" />
                                    Profile Console
                                </button>
                                <button className="w-full flex items-center gap-3.5 px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-teal-600 rounded-xl transition-all group">
                                    <Settings size={16} className="group-hover:rotate-45 transition-transform" />
                                    Security Matrix
                                </button>
                                <div className="my-2 border-t border-slate-100"></div>
                                <button onClick={handleLogout} className="w-full flex items-center gap-3.5 px-4 py-4 text-[11px] font-black text-white bg-slate-900 hover:bg-red-500 rounded-2xl transition-all group shadow-xl shadow-slate-900/10">
                                    <LogOut size={16} />
                                    Terminate
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
