import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { premiumConfirm } from '../../utils/premiumConfirm';
import { Eye, Edit2, Ban, Trash2, Filter, Download, UserPlus, Search, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Mentors = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';
    const [mentors, setMentors] = useState([]);
    const [filteredMentors, setFilteredMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [mentorStudents, setMentorStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        status: '',
        role: 'mentor'
    });

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/mentors');
            const realMentors = response.data.data;

            setMentors(realMentors);
            setFilteredMentors(realMentors);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch mentors");
            setLoading(false);
        }
    };

    const handleSearch = (query) => {
        const filtered = mentors.filter(m =>
            m.name?.toLowerCase().includes(query.toLowerCase()) ||
            m.email?.toLowerCase().includes(query.toLowerCase()) ||
            m.phone?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredMentors(filtered);
    };

    const handleView = async (mentor) => {
        setSelectedMentor(mentor);
        setIsModalOpen(true);
        setLoadingStudents(true);
        try {
            const res = await api.get(`/admin/students?mentor_id=${mentor.id}`);
            if (res.data.success) {
                setMentorStudents(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch mentor students");
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleEdit = (mentor) => {
        setSelectedMentor(mentor);
        setEditFormData({
            name: mentor.name,
            email: mentor.email,
            phone_number: mentor.phone || '',
            status: mentor.status,
            role: 'mentor'
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${selectedMentor.id}`, editFormData);
            toast.success("Mentor updated successfully");
            setIsEditModalOpen(false);
            fetchMentors();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update mentor");
        }
    };

    const handleApprove = async (mentor) => {
        try {
            await api.put(`/admin/approve/${mentor.id}`);
            toast.success(`${mentor.name} approved successfully`);
            fetchMentors();
        } catch (error) {
            toast.error("Failed to approve mentor");
        }
    };

    const handleBlock = async (mentor) => {
        premiumConfirm(async () => {
            try {
                await api.put(`/admin/block/${mentor.id}`);
                toast.success(`${mentor.name} blocked successfully`);
                fetchMentors();
            } catch (error) {
                toast.error("Failed to block mentor");
            }
        }, { 
            name: mentor.name, 
            title: 'Block Access', 
            message: `Suspending access for ${mentor.name} will prevent them from logging in. Continue?`,
            type: 'standard'
        });
    };

    const handleDelete = async (mentor) => {
        premiumConfirm(async () => {
            try {
                await api.delete(`/admin/delete/${mentor.id}`);
                toast.success(`${mentor.name} deleted successfully`);
                fetchMentors();
            } catch (error) {
                toast.error("Failed to delete mentor");
            }
        }, { 
            name: mentor.name, 
            title: 'Permanent Deletion', 
            message: `Are you sure you want to delete ${mentor.name}? Their personal profile will be removed forever.`,
            type: 'danger'
        });
    };

    const columns = [
        { header: 'Mentor Name', accessor: 'name' },
        { header: 'Email ID', accessor: 'email' },
        { header: 'Assigned Students', accessor: 'studentsCount' },
        {
            header: 'Performance Level',
            accessor: 'completionRate',
            render: (row) => (
                <div className="flex flex-col gap-1.5 w-32">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                        <span>Rate</span>
                        <span className="text-emerald-600">{row.completionRate}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-1000" style={{ width: `${row.completionRate}%` }}></div>
                    </div>
                </div>
            )
        },
        {
            header: 'Account Status',
            accessor: 'status',
            render: (row) => (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${row.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    {row.status}
                </span>
            )
        },
    ];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col mb-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Mentor Network</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Analyzing performance metrics and assignment distribution</p>
            </div>

            <DataTable
                columns={columns}
                data={filteredMentors}
                loading={loading}
                onSearch={handleSearch}
                onView={handleView}
                onApprove={isSuperAdmin ? handleApprove : undefined}
                onBlock={isSuperAdmin ? handleBlock : undefined}
                onDelete={isSuperAdmin ? handleDelete : undefined}
                onEdit={isSuperAdmin ? handleEdit : undefined}
                searchPlaceholder="Filter mentors by name or email..."
            />

            {/* Edit Mentor Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Mentor Profile"
                size="md"
            >
                <form onSubmit={handleUpdate} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                        <input
                            type="text"
                            className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                        <input
                            type="email"
                            className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                        <input
                            type="text"
                            className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all"
                            value={editFormData.phone_number}
                            onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Account Status</label>
                        <select
                            className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all"
                            value={editFormData.status}
                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-lg">Save Changes</button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Performance Analytics Profile"
                size="lg"
            >
                {selectedMentor && (
                    <div className="flex flex-col gap-10">
                        <div className="flex items-center gap-6 p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                            <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center text-3xl font-bold shadow-lg shadow-emerald-100">
                                {selectedMentor.name.charAt(0)}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-2xl font-bold text-slate-900">{selectedMentor.name}</h3>
                                <p className="text-slate-500 font-medium">{selectedMentor.email}</p>
                                <div className="mt-2">
                                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm">
                                        ID: MNT-{selectedMentor.id.toString().padStart(4, '0')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <MentorStat label="Active Students" value={selectedMentor.studentsCount} icon={<Users size={18} />} color="teal" />
                            <MentorStat label="Total Tasks" value={selectedMentor.tasksAssigned} icon={<ListTodo size={18} />} color="yellow" />
                            <MentorStat label="Success Rate" value={`${selectedMentor.completionRate}%`} icon={<TrendingUp size={18} />} color="emerald" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-white border border-slate-100 rounded-2xl p-6">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Assigned Students</h5>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {loadingStudents ? (
                                        <div className="text-center py-4 text-[10px] font-black text-slate-400 animate-pulse">FETCHING STUDENTS...</div>
                                    ) : mentorStudents.length > 0 ? mentorStudents.map((student) => (
                                        <div key={student.id} className="flex justify-between items-center p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-all cursor-default group">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700 group-hover:text-[#008080] transition-colors uppercase italic">{student.name}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{student.registration_number || 'NO_REG'}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-[#008080] uppercase">{student.course}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">{student.grade}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">No students assigned</div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl p-6">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Immediate Deliverables</h5>
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-all cursor-default group">
                                            <span className="text-sm font-semibold text-slate-700 group-hover:text-amber-600 transition-colors">Assessment {i + 1}</span>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {i === 0 ? 'Pending' : 'Done'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <button className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all" onClick={() => setIsModalOpen(false)}>Close</button>
                            <button className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Broadcast Announcement</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const MentorStat = ({ label, value, icon, color }) => {
    const colors = {
        teal: 'bg-[#008080]/10 text-white border-[#008080]',
        yellow: 'bg-[#f8ba2b]/10 text-slate-900 border-[#f8ba2b]',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    return (
        <div className={`p-4 border rounded-2xl flex items-center gap-4 hover:shadow-sm transition-all ${colors[color]}`}>
            <div className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm">
                {icon}
            </div>
            <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
                <h4 className="text-xl font-black">{value}</h4>
            </div>
        </div>
    );
};

export default Mentors;
