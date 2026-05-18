import React, { useState, useEffect } from 'react';
import {
 Activity,
 CheckCircle,
 XCircle,
 Loader2,
 Shield,
 User,
 Calendar,
 ArrowUpRight,
 Mail,
 MapPin,
 Phone,
 UserCheck
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { premiumConfirm } from '../../utils/premiumConfirm';

const Approvals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [portalLogins, setPortalLogins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pendingRes, portalRes] = await Promise.all([
        api.get('/admin/pending-users'),
        api.get('/admin/student-portal-logins')
      ]);
      if (pendingRes.data.success) setPendingUsers(pendingRes.data.data);
      if (portalRes.data.success) setPortalLogins(portalRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, role) => {
    try {
      await api.put(`/admin/approve/${id}`, { role });
      toast.success(`${role === 'student' ? 'Student' : 'User'} approved successfully`);
      setPendingUsers(prev => prev.filter(user => !(user.id === id && user.role === role)));
      // Trigger notification refresh
      if (window.refetchNotifications) window.refetchNotifications();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error("Failed to approve user");
    }
  };

  const handleReject = async (id, role, name = 'this user') => {
    premiumConfirm(async () => {
      try {
        await api.put(`/admin/reject/${id}`, { role });
        toast.success(`${role === 'student' ? 'Student' : 'User'} rejected successfully`);
        setPendingUsers(prev => prev.filter(user => !(user.id === id && user.role === role)));
        if (window.refetchNotifications) window.refetchNotifications();
      } catch (error) {
        console.error('Reject error:', error);
        toast.error("Failed to reject user");
      }
    }, { 
      name: name,
      title: 'Reject Registration', 
      message: `Are you sure you want to reject this ${role === 'student' ? 'student' : 'user'}?`,
      type: 'danger'
    });
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'academic_head': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'mentor_head': return 'bg-[#008080]/10 text-[#008080] border-[#008080]/20';
      case 'faculty': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'mentor': return 'bg-[#008080]/10 text-[#008080] border-[#008080]/20';
      case 'student': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#008080] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl p-12 rounded-[40px] border border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-[#008080] rounded-[28px] shadow-2xl shadow-[#008080]/30 flex items-center justify-center">
              <Shield className="text-white" size={36} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">Verification Hub</h2>
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center md:justify-start gap-3 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Staff Approvals & Portal Activity Monitoring
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 px-8 py-4 rounded-[28px] border border-slate-800 shadow-2xl flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Pending</span>
              <span className="text-2xl font-black text-white leading-none">{pendingUsers.length}</span>
            </div>
            <Activity className="text-amber-500" size={20} />
          </div>
          <div className="bg-[#008080] px-8 py-4 rounded-[28px] border border-[#008080] shadow-2xl flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Active Now</span>
              <span className="text-2xl font-black text-white leading-none">{portalLogins.length}</span>
            </div>
            <ArrowUpRight className="text-white" size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Pending Approvals Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <UserCheck className="text-[#008080]" />
              STAFF APPROVALS
            </h3>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Action Required
            </span>
          </div>
          
          <div className="flex-1 min-h-[400px]">
            {pendingUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50">
                    {pendingUsers.map((user) => (
                      <tr key={`${user.role}-${user.id}`} className="hover:bg-slate-50/50 transition-all group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 font-black border border-slate-100 group-hover:text-[#008080] transition-all">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-800 block uppercase tracking-tight">{user.name}</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 inline-block ${user.role === 'student' ? 'text-slate-400' : 'text-[#008080]'}`}>
                                {user.role.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleReject(user.id, user.role, user.name)} className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all">
                              <XCircle size={18} />
                            </button>
                            <button onClick={() => handleApprove(user.id, user.role)} className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all">
                              <CheckCircle size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <CheckCircle size={32} className="mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No pending staff</p>
              </div>
            )}
          </div>
        </div>

        {/* Student Portal Activity (Portal Logins) */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-[#008080]/5">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Activity className="text-[#008080]" />
              STUDENT PORTAL ACTIVITY
            </h3>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-[#008080] uppercase tracking-widest">
              Live Logs
            </span>
          </div>

          <div className="flex-1 min-h-[400px]">
            {portalLogins.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50">
                    {portalLogins.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#008080] font-black border border-slate-100">
                              <User size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-800 block uppercase tracking-tight">
                                  {log.message.replace('<b>Student Portal Login:</b> ', '').replace(' logged into the student dashboard.', '')}
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              </div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                  <Calendar size={10} />
                                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-[9px] font-black text-[#008080] uppercase tracking-widest">
                                  {log.grade} | {log.course}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Mail size={10} /> {log.email || 'N/A'}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Phone size={10} /> {log.phone_number || 'N/A'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Activity size={32} className="mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No recent portal activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Approvals;
