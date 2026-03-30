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
    Phone
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { premiumConfirm } from '../../utils/premiumConfirm';

const Approvals = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const res = await api.get('/admin/pending-users');
            if (res.data.success) {
                setPendingUsers(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching pending users:', error);
            toast.error("Failed to load pending approvals");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id, role) => {
        try {
            await api.put(`/admin/approve/${id}`, { role });
            toast.success(`${role === 'student' ? 'Student' : 'User'} approved successfully`);
            setPendingUsers(prev => prev.filter(user => !(user.id === id && user.role === role)));
            // Trigger notification refresh for 'at the spot' feel
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
                // Trigger notification refresh
                if (window.refetchNotifications) window.refetchNotifications();
            } catch (error) {
                console.error('Reject error:', error);
                toast.error("Failed to reject user");
            }
        }, { 
            name: name,
            title: 'Reject Registration', 
            message: `Are you sure you want to reject this ${role === 'student' ? 'student' : 'user'}? They will not be able to access the platform.`,
            type: 'danger'
        });
    };

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'academic_head':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'mentor_head':
                return 'bg-[#008080]/10 text-[#008080] border-[#008080]';
            case 'faculty':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'mentor':
                return 'bg-teal-50 text-teal-700 border-teal-200';
            case 'student':
                return 'bg-slate-100 text-slate-600 border-slate-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
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
        <div className="space-y-4 md:space-y-8 w-full max-w-full">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-[#008080] rounded-2xl shadow-lg shadow-[#008080]/20">
                            <Shield className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Pending Approvals</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 ml-1">
                                Secure Admission & Staff Activation Portal
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Requests</span>
                        <span className="text-lg font-black text-slate-900 leading-tight">{pendingUsers.length}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-100"></div>
                    <Activity className="text-[#008080] animate-pulse" size={20} />
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                {pendingUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Details</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Designated Role</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source/Registered By</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pendingUsers.map((user) => (
                                    <tr key={`${user.role}-${user.id}`} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black border border-slate-100 group-hover:bg-white group-hover:border-[#008080] group-hover:text-[#008080] transition-all">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-black text-slate-900 block group-hover:text-[#008080] transition-colors">{user.name}</span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Calendar size={10} className="text-slate-300" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm transition-transform group-hover:scale-105 ${getRoleBadgeStyle(user.role)}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.role === 'student' ? 'bg-slate-400' : 'bg-current'}`} />
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100">
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-black text-slate-700 block">{user.registered_by_name || 'System / Self'}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Authorized Registrar</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{user.email || 'NO_EMAIL_PROVIDED'}</span>
                                                <span className="text-[10px] font-black text-slate-400 tracking-wider">
                                                    {user.phone_number || 'NO_PH_RECORDED'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opactiy-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleReject(user.id, user.role, user.name)}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                                                    title="Reject Application"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                                <button
                                                     onClick={() => handleApprove(user.id, user.role)}
                                                     className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#008080]/10 text-[#008080] hover:bg-[#008080] hover:text-white transition-all shadow-sm shadow-[#008080]/10"
                                                     title="Approve & Activate"
                                                 >
                                                     <CheckCircle size={20} />
                                                 </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border-4 border-white shadow-inner">
                            <CheckCircle size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pipeline Clear</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-3">
                            All registration requests have been processed
                        </p>
                    </div>
                )}
            </div>

            <div className="bg-[#008080] rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-md">
                        <h3 className="text-2xl font-black mb-2 tracking-tight">Security Protocol Enforcement</h3>
                        <p className="text-white/80 text-sm font-medium leading-relaxed">
                            Every account activated here gains immediate access to their designated tools.
                            Rejected records are permanently archived in the system to prevent spam.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="bg-yellow-400 p-6 rounded-3xl w-full md:w-44 text-center shadow-lg shadow-yellow-400/20">
                            <span className="text-[10px] font-black text-black/50 uppercase tracking-widest block mb-1">Approved Today</span>
                            <span className="text-3xl font-black text-black tracking-tighter">0</span>
                        </div>
                        <div className="bg-yellow-400 p-6 rounded-3xl w-full md:w-44 text-center shadow-lg shadow-yellow-400/20">
                            <span className="text-[10px] font-black text-black/50 uppercase tracking-widest block mb-1 text-rose-800">Rejected Today</span>
                            <span className="text-3xl font-black text-black tracking-tighter">0</span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
            </div>
        </div>
    );
};

export default Approvals;
