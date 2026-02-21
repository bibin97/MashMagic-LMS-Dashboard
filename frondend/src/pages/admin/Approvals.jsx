import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Activity,
    CheckCircle,
    XCircle,
    Loader2,
    Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const Approvals = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/admin/pending-users', {
                headers: { Authorization: `Bearer ${token}` }
            });
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
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/admin/approve/${id}`, { role }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`${role === 'student' ? 'Student' : 'User'} approved successfully`);
            setPendingUsers(prev => prev.filter(user => !(user.id === id && user.role === role)));
        } catch (error) {
            console.error('Approve error:', error);
            toast.error("Failed to approve user");
        }
    };

    const handleReject = async (id, role) => {
        if (!window.confirm(`Are you sure you want to reject this ${role === 'student' ? 'student' : 'user'}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/admin/reject/${id}`, { role }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`${role === 'student' ? 'Student' : 'User'} rejected successfully`);
            setPendingUsers(prev => prev.filter(user => !(user.id === id && user.role === role)));
        } catch (error) {
            console.error('Reject error:', error);
            toast.error("Failed to reject user");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Shield className="text-indigo-600" size={32} />
                        Pending Approvals
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 ml-1">
                        Review and manage new account requests
                    </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Requests: </span>
                    <span className="text-lg font-black text-indigo-600 ml-2">{pendingUsers.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                {pendingUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Place</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pendingUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-black text-slate-900 block">{user.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(user.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.role === 'mentor' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                user.role === 'faculty' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-slate-600">{user.email || 'N/A'}</span>
                                                <span className="text-xs font-bold text-slate-400">{user.phone_number || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{user.place || 'N/A'}</span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleReject(user.id, user.role)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100"
                                                    title="Reject"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(user.id, user.role)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100 shadow-sm"
                                                    title="Approve"
                                                >
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
                    <div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">All Caught Up!</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
                            No pending requests at the moment.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Approvals;
