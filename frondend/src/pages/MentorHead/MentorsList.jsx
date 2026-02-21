import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users,
    Search,
    MoreHorizontal,
    Phone,
    MapPin,
    Loader2,
    LayoutDashboard,
    CheckCircle2,
    ArrowUpDown,
    Edit2,
    Trash2,
    X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MentorsList = () => {
    const navigate = useNavigate();
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMentor, setEditingMentor] = useState({ id: '', name: '', email: '', phone_number: '', place: '', password: '' });

    useEffect(() => {
        const fetchMentors = async () => {
            try {
                const token = localStorage.getItem('token');
                // Fetching from the new activity dashboard endpoint which has progress logic
                const res = await axios.get('http://localhost:5000/api/mentor-head/mentor-activity', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setMentors(res.data.data);
                }
            } catch (error) {
                console.error('Error fetching mentors:', error);
                toast.error("Failed to load mentors list");
            } finally {
                setLoading(false);
            }
        };

        fetchMentors();
    }, []);

    const filteredMentors = mentors.filter(m =>
        m.mentor_name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone_number?.includes(searchTerm)
    );

    const handleEdit = (mentor) => {
        setEditingMentor({ id: mentor.mentor_id, name: mentor.mentor_name, email: mentor.email || '', phone_number: mentor.phone_number || '', place: mentor.place || '', password: '' });
        setIsEditModalOpen(true);
    };

    const handleUpdateMentor = async () => {
        try {
            const token = localStorage.getItem('token');
            // Using the actual server endpoint that handles edit
            const payload = { ...editingMentor };
            if (!payload.password) delete payload.password; // Don't send empty password

            const res = await axios.put(`http://localhost:5000/api/mentor-head/mentors/${editingMentor.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success('Mentor details updated successfully');
                setIsEditModalOpen(false);
                setMentors(mentors.map(m => m.mentor_id === editingMentor.id ? { ...m, mentor_name: editingMentor.name, email: editingMentor.email, phone_number: editingMentor.phone_number, place: editingMentor.place } : m));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update mentor');
        }
    };

    const handleDelete = async (mentorId) => {
        if (!window.confirm("Are you sure you want to delete this mentor? This action cannot be undone.")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.delete(`http://localhost:5000/api/mentor-head/mentors/${mentorId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success('Mentor deleted successfully');
                setMentors(mentors.filter(m => m.mentor_id !== mentorId));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete mentor');
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Faculty</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Personnel Directory</p>
                </div>
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="FILTER BY NAME, PHONE, OR LOCATION..."
                        className="pl-14 pr-8 py-4 bg-white border border-slate-100 rounded-3xl text-xs font-bold uppercase tracking-[0.1em] focus:ring-4 ring-indigo-500/10 w-full md:w-96 shadow-sm transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Mentor</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Students</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Connected Today</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[250px]">Connection Progress</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredMentors.map((mentor) => {
                                const total = mentor.total_assigned_students || 0;
                                const connected = mentor.students_connected_today || 0;
                                const progress = total > 0 ? (connected / total) * 100 : 0;

                                return (
                                    <tr key={mentor.mentor_id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                                                    {mentor.mentor_name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-black text-slate-900">{mentor.mentor_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className="text-sm font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                                                {total}
                                            </span>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                                {connected}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-400 to-indigo-500 transition-all duration-1000"
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 w-10 text-right">
                                                    {progress.toFixed(0)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/mentor-head/mentors/${mentor.mentor_id}`)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
                                                    title="View Profile"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(mentor)}
                                                    className="p-2 border border-slate-200 bg-white rounded-xl text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                                                    title="Edit Mentor"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(mentor.mentor_id)}
                                                    className="p-2 border border-slate-200 bg-white rounded-xl text-rose-600 hover:bg-rose-50 transition-colors shadow-sm"
                                                    title="Delete Mentor"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredMentors.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                        <Users size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">System Empty</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto">
                        No mentors found matching your current filters. Try expanding your search.
                    </p>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <Edit2 size={20} className="text-indigo-600" /> Edit Mentor Details
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mentor Name</label>
                                <input
                                    type="text"
                                    value={editingMentor.name}
                                    onChange={(e) => setEditingMentor(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={editingMentor.email}
                                    onChange={(e) => setEditingMentor(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    value={editingMentor.phone_number}
                                    onChange={(e) => setEditingMentor(prev => ({ ...prev, phone_number: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Location / Place</label>
                                <input
                                    type="text"
                                    value={editingMentor.place}
                                    onChange={(e) => setEditingMentor(prev => ({ ...prev, place: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-rose-500">New Password (Leave blank to keep current)</label>
                                <input
                                    type="password"
                                    placeholder="Enter new password to assign to new mentor"
                                    value={editingMentor.password}
                                    onChange={(e) => setEditingMentor(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full bg-rose-50 border border-rose-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateMentor}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorsList;
