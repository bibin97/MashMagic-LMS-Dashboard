import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { premiumConfirm } from '../../utils/premiumConfirm';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCog, Mail, Phone, Briefcase } from 'lucide-react';

const StaffManagement = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';
    const [staff, setStaff] = useState([]);
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        role: '',
        status: ''
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/staff');
            setStaff(response.data.data);
            setFilteredStaff(response.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch staff members");
            setLoading(false);
        }
    };

    const handleSearch = (query) => {
        const filtered = staff.filter(m =>
            m.name?.toLowerCase().includes(query.toLowerCase()) ||
            m.email?.toLowerCase().includes(query.toLowerCase()) ||
            m.role?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredStaff(filtered);
    };

    const handleEdit = (member) => {
        setSelectedMember(member);
        setEditFormData({
            name: member.name,
            email: member.email,
            phone_number: member.phone || '',
            role: member.role,
            status: member.status
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${selectedMember.id}`, editFormData);
            toast.success("Staff profile updated successfully");
            setIsEditModalOpen(false);
            fetchStaff();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        }
    };

    const handleDelete = async (member) => {
        premiumConfirm(async () => {
            try {
                await api.delete(`/admin/delete/${member.id}`);
                toast.success("Staff member removed from system");
                fetchStaff();
            } catch (error) {
                toast.error("Failed to delete member");
            }
        }, { 
            name: member.name, 
            title: 'Remove Staff Member', 
            message: `Permanently deleting ${member.name} (${member.role.replace('_', ' ')}). This action cannot be undone.`,
            type: 'danger'
        });
    };

    const columns = [
        { header: 'Full Name', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        {
            header: 'Role',
            accessor: 'role',
            render: (row) => (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    {row.role.replace('_', ' ')}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${row.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    {row.status}
                </span>
            )
        },
    ];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col mb-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Staff</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Managing core operational roles and team hierarchy</p>
            </div>

            <DataTable
                columns={columns}
                data={filteredStaff}
                loading={loading}
                onSearch={handleSearch}
                onDelete={isSuperAdmin ? handleDelete : undefined}
                onEdit={isSuperAdmin ? handleEdit : undefined}
                searchPlaceholder="Search by name, email or role..."
            />

            {/* Edit Staff Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Modify Staff Credentials"
                size="md"
            >
                <form onSubmit={handleUpdate} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                        <div className="relative">
                            <UserCog size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all shadow-sm"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all shadow-sm"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all shadow-sm"
                                    value={editFormData.phone_number}
                                    onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Operational Role</label>
                            <div className="relative">
                                <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all shadow-sm appearance-none"
                                    value={editFormData.role}
                                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                >
                                    <option value="mentor">Mentor</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="mentor_head">Mentor Head</option>
                                    <option value="academic_head">Academic Head</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Account Status</label>
                            <div className="relative">
                                <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all shadow-sm appearance-none"
                                    value={editFormData.status}
                                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-50">
                        <button
                            type="button"
                            className="px-6 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 rounded-2xl bg-[#008080] text-white text-sm font-bold hover:bg-[#008080] transition-all shadow-lg shadow-[#008080]/30 active:scale-95"
                        >
                            Commit Changes
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StaffManagement;
