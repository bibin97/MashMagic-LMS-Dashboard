import React, { useState, useEffect } from 'react';
import {
    Shield,
    UserPlus,
    Search,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Loader2,
    ShieldCheck,
    Mail,
    Phone,
    Lock,
    User
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { premiumConfirm } from '../../utils/premiumConfirm';

const AdminManagement = () => {
    const [subAdmins, setSubAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        status: 'active'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchSubAdmins();
    }, []);

    const fetchSubAdmins = async () => {
        try {
            const res = await api.get('/admin/sub-admins');
            if (res.data.success) {
                setSubAdmins(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching sub-admins:', error);
            toast.error("Failed to load admin accounts");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingAdmin(null);
        setFormData({
            name: '',
            email: '',
            phone_number: '',
            password: '',
            status: 'active'
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (admin) => {
        setEditingAdmin(admin);
        setFormData({
            name: admin.name,
            email: admin.email,
            phone_number: admin.phone_number || '',
            password: '', // Keep password empty unless changing
            status: admin.status
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingAdmin) {
                await api.put(`/admin/sub-admins/${editingAdmin.id}`, formData);
                toast.success("Sub Admin updated successfully");
            } else {
                await api.post('/admin/sub-admins', formData);
                toast.success("Sub Admin created successfully");
            }
            setIsModalOpen(false);
            fetchSubAdmins();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        premiumConfirm(async () => {
            try {
                await api.delete(`/admin/sub-admins/${id}`);
                toast.success("Sub Admin deleted successfully");
                fetchSubAdmins();
            } catch (error) {
                toast.error("Failed to delete account");
            }
        }, { 
            name: name,
            title: 'Delete Admin Account', 
            message: `You are about to permanently delete the admin account for ${name}. This will revoke all their management privileges.`,
            type: 'danger'
        });
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
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
                        <ShieldCheck className="text-indigo-600" size={32} />
                        Admin Management
                    </h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">
                        Control system access and role management for the application
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                >
                    <UserPlus size={18} />
                    <span>Create Sub Admin</span>
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Details</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created Date</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {subAdmins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
                                                {admin.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="text-sm font-black text-slate-900 block">{admin.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sub Admin</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-slate-600">{admin.email}</span>
                                            <span className="text-xs font-bold text-slate-400">{admin.phone_number || 'No Phone'}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${admin.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : 'bg-rose-50 text-rose-700 border-rose-100'
                                            }`}>
                                            {admin.status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-xs font-bold text-slate-500">
                                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString('en-GB') : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(admin)}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(admin.id, admin.name)}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {subAdmins.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <Shield size={32} />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900">No Sub Admins Found</h3>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Create your first sub admin to start delegating work.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingAdmin ? "Edit Sub Admin" : "Create New Sub Admin"}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-bold tracking-wide"
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    disabled={!!editingAdmin}
                                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-bold tracking-wide disabled:opacity-50"
                                    placeholder="email@mashmagic.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                            <div className="relative group">
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="tel"
                                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-bold tracking-wide"
                                    placeholder="Enter mobile number"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Status</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'active' })}
                                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${formData.status === 'active'
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                                        }`}
                                >
                                    <CheckCircle size={14} />
                                    Active
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'inactive' })}
                                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${formData.status === 'inactive'
                                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-100'
                                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                                        }`}
                                >
                                    <XCircle size={14} />
                                    Inactive
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                {editingAdmin ? "Reset Password (Leave blank to keep)" : "Password"}
                            </label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="password"
                                    required={!editingAdmin}
                                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-bold tracking-wide"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 p-5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] p-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <span>{editingAdmin ? "Update Admin" : "Authorize Creation"}</span>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminManagement;
