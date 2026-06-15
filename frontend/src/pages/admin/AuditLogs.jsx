import React, { useState, useEffect, useDeferredValue } from 'react';
import api from '../../services/api';
import { ShieldCheck, Bell, Clock, Search, Filter, Trash2, CheckCircle2, AlertCircle, ShieldAlert, Trash, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
const AuditLogs = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [typeFilter, setTypeFilter] = useState('all');
  useEffect(() => {
    fetchNotifications();
  }, []);
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/notifications');
      setNotifications(res.data.data);
    } catch (error) {
      toast.error("Failed to load system audit logs");
    } finally {
      setLoading(false);
    }
  };
  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to purge all audit records?")) return;
    try {
      await api.delete('/admin/notifications/clear-all');
      setNotifications([]);
      toast.success("Audit logs purged");
    } catch (error) {
      toast.error("Purge failed");
    }
  };
  const filteredLogs = notifications.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(deferredSearchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || log.action_type === typeFilter;
    return matchesSearch && matchesType;
  });
  const getIcon = type => {
    if (type?.includes('fraud')) return <ShieldAlert className="text-rose-500" size={20} />;
    if (type?.includes('registration')) return <CheckCircle2 className="text-[#008080]" size={20} />;
    return <Bell className="text-slate-400" size={20} />;
  };
  return <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <header className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-10">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-4">System Notifications & Logs</h1>
                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                        <ShieldCheck size={16} className="text-[#008080]" />
                        Monitor recent system activities and notifications
                    </p>
                </div>
                <div className="flex gap-4">
                    <button onClick={fetchNotifications} className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-slate-600 hover:bg-white hover:shadow-lg transition-all">
                        <RefreshCw size={20} />
                    </button>
                    <button onClick={handleClearAll} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-[1.5rem] border border-rose-100 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                        Clear All Notifications
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 relative group">
                    <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#008080] transition-colors" />
                    <input type="text" placeholder="Search notifications..." className="w-full bg-white p-6 pl-16 rounded-[2.5rem] border border-slate-100 shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/5 font-bold text-slate-700 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-white px-10 py-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-[#008080]/5 cursor-pointer">
                    <option value="all">All Notifications</option>
                    <option value="mentor_session_report">Mentor Session Reports</option>
                    <option value="fraud_alert">Security Alerts</option>
                    <option value="mentor_registration">Registrations</option>
                    <option value="staff_update">System Updates</option>
                </select>
            </div>

            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-10 py-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">Date & Time</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">Message / Details</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">Category</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td className="p-6 text-sm font-black text-slate-400 border-b border-slate-50">{i + 1}</td>
                                        <td colSpan="4" className="px-10 py-8"><div className="h-6 bg-slate-100 rounded-full w-full"></div></td>
                                    </tr>) : filteredLogs.length > 0 ? filteredLogs.map((log, index) => <tr key={log.id} className={`hover:bg-slate-50/50 transition-all group ${log.is_read ? 'opacity-60' : ''}`}><td className="p-6 text-sm font-black text-slate-400 border-b border-slate-50">{index + 1}</td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-[#008080] group-hover:text-white transition-all">
                                                    <Clock size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{new Date(log.created_at).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }).toUpperCase()}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2.5 h-2.5 rounded-full bg-[#008080]/30 group-hover:bg-[#008080] transition-colors shadow-[0_0_10px_rgba(0,128,128,0.2)]"></div>
                                                <div className="text-xs font-bold text-slate-700 leading-relaxed max-w-xl" dangerouslySetInnerHTML={{
                    __html: log.message
                  }}></div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                {getIcon(log.action_type)}
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{log.action_type?.replace(/_/g, ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!log.is_read && <button className="text-[9px] font-black text-[#008080] uppercase tracking-widest flex items-center gap-2 hover:underline">
                                                        Mark as Read
                                                    </button>}
                                                <button className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>) : <tr>
                                    <td colSpan="4" className="px-10 py-40 text-center">
                                        <ShieldCheck size={48} className="text-slate-100 mx-auto mb-6" />
                                        <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.4em]">No notifications found.</p>
                                    </td>
                                </tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>;
};
export default AuditLogs;