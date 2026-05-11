import React, { useState, useEffect } from 'react';
import {
 Users, Search, Edit2, Trash2, X, Save,
 ShieldCheck, Activity, MapPin, Phone, Mail, Calendar, Briefcase
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { premiumConfirm } from '../../utils/premiumConfirm';

const FacultyDirectory = () => {
 const [faculties, setFaculties] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 const [editingFaculty, setEditingFaculty] = useState(null);

 useEffect(() => {
 fetchFaculties();
 }, []);

 const fetchFaculties = async () => {
 try {
 const res = await api.get('/mentor-head/faculties-all');
 if (res.data.success) {
 setFaculties(res.data.data);
 }
 } catch (error) {
 toast.error("Failed to load faculty directory");
 } finally {
 setLoading(false);
 }
 };

 const handleEdit = (faculty) => {
 setEditingFaculty({ ...faculty });
 setIsEditModalOpen(true);
 };

 const handleUpdate = async () => {
 try {
 const res = await api.put(`/mentor-head/faculties/${editingFaculty.id}`, editingFaculty);
 if (res.data.success) {
 toast.success("Faculty profile updated");
 setIsEditModalOpen(false);
 fetchFaculties();
 }
 } catch (error) {
 toast.error(error.response?.data?.message || "Update failed");
 }
 };

 const handleDelete = async (id, name) => {
 premiumConfirm(async () => {
 try {
 const res = await api.delete(`/mentor-head/faculties/${id}`);
 if (res.data.success) {
 toast.success("Faculty record deleted");
 fetchFaculties();
 }
 } catch (error) {
 toast.error(error.response?.data?.message || "Delete failed");
 }
 }, {
 name: name,
 title: 'Delete Faculty Record',
 message: `Are you sure you want to permanently delete the faculty record for ${name}?`,
 type: 'danger'
 });
 };

 const filteredFaculties = faculties.filter(f =>
 f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 f.email?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 if (loading) return <div className="p-20 text-center font-black text-slate-600 animate-pulse">SYNCING FACULTY DATA...</div>;

 return (
 <div className="space-y-8 animate-in fade-in duration-700">
 {/* Header */}
 <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
 <div>
 <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-4">
 <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 rotate-3">
 <Briefcase size={28} />
 </div>
 Faculty Registry
 </h2>
 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-3 flex items-center gap-2">
 <ShieldCheck size={14} className="text-emerald-500" />
 Mentor Head level oversight of teaching staff and account status
 </p>
 </div>

 <div className="relative group">
 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors" size={18} />
 <input
 type="text"
 placeholder="FILTER BY NAME OR EMAIL..."
 className="pl-14 pr-8 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-bold uppercase tracking-[0.1em] focus:ring-4 ring-[#008080]/10 w-full md:w-96 shadow-sm transition-all outline-none focus:bg-white"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </div>

 {/* List */}
 <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-100">
 <th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Faculty</th>
 <th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Email</th>
 <th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Phone</th>
 <th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Place</th>
 <th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {filteredFaculties.length > 0 ? filteredFaculties.map((faculty) => (
 <tr key={faculty.id} className="hover:bg-emerald-50/20 transition-all group">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-[#008080] rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-emerald-100">
 {faculty.name?.charAt(0)}
 </div>
 <div className="min-w-0">
 <div className="text-sm font-black text-slate-900 group-hover:text-[#008080] transition-colors uppercase truncate">{faculty.name}</div>
 <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">ID {faculty.id}</div>
 </div>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center gap-2 text-xs font-bold text-slate-600 break-all">
 <Mail size={14} className="text-slate-300" />
 {faculty.email || 'N/A'}
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
 <Phone size={14} className="text-slate-300" />
 {faculty.phone_number || 'N/A'}
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
 <MapPin size={14} className="text-slate-300" />
 {faculty.place || 'N/A'}
 </div>
 </td>
 <td className="px-8 py-6">
 <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${String(faculty.status || 'active').toLowerCase() === 'active'
 ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
 : 'bg-rose-50 text-rose-600 border-rose-100'
 }`}>
 <Activity size={12} className={String(faculty.status || 'active').toLowerCase() === 'active' ? 'text-emerald-500' : 'text-rose-500'} />
 {faculty.status || 'active'}
 </span>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={5} className="px-8 py-20 text-center">
 <p className="text-slate-600 font-black text-[10px] uppercase tracking-[0.3em]">System empty or no faculty found</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
};

export default FacultyDirectory;
