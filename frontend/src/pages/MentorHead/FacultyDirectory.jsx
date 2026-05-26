import React, { useState, useEffect } from 'react';
import {
 Users, Search, Edit2, Trash2, X, Save, Eye,
 ShieldCheck, Activity, MapPin, Phone, Mail, Calendar, Briefcase
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { premiumConfirm } from '../../utils/premiumConfirm';

const FacultyDirectory = () => {
 const [faculties, setFaculties] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedFaculty, setSelectedFaculty] = useState(null);
 const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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
 <th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Actions</th>
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
 <td className="px-8 py-6 text-right">
 <button
 onClick={() => {
 setSelectedFaculty(faculty);
 setIsDetailModalOpen(true);
 }}
 className="p-2.5 bg-white border border-slate-200 rounded-xl text-[#008080] hover:bg-[#008080]/10 transition-all shadow-sm"
 title="View Profile"
 >
 <Eye size={16} />
 </button>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={6} className="px-8 py-20 text-center">
 <p className="text-slate-600 font-black text-[10px] uppercase tracking-[0.3em]">System empty or no faculty found</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Faculty Detail Modal */}
 {isDetailModalOpen && selectedFaculty && (
 <div className="fixed inset-0 bg-[#008080]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
 <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
 <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg uppercase">
 {selectedFaculty.name.charAt(0)}
 </div>
 <div>
 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Faculty Identity</h2>
 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Academic Professional Profile</p>
 </div>
 </div>
 <button
 onClick={() => setIsDetailModalOpen(false)}
 className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all"
 >
 <X size={20} />
 </button>
 </div>

 <div className="p-10 space-y-10">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
 <div className="space-y-6">
 <div className="flex flex-col gap-1">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</span>
 <p className="text-lg font-black text-slate-900 uppercase">{selectedFaculty.name}</p>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</span>
 <p className="text-sm font-bold text-slate-700">{selectedFaculty.email || 'N/A'}</p>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</span>
 <p className="text-sm font-bold text-slate-700">{selectedFaculty.phone_number || 'N/A'}</p>
 </div>
 </div>
 <div className="space-y-6">
 <div className="flex flex-col gap-1">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Pulse</span>
 <div className="flex items-center gap-2 mt-1">
 <div className={`w-2 h-2 rounded-full ${String(selectedFaculty.status || 'active').toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{selectedFaculty.status || 'ACTIVE'}</p>
 </div>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Geographic Location</span>
 <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{selectedFaculty.place || 'Not Specified'}</p>
 </div>
 </div>
 </div>

 <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
 <ShieldCheck size={24} />
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Administrative Role</p>
 <p className="text-xs font-black text-slate-900 uppercase">Verified Teaching Faculty</p>
 </div>
 </div>
 <button
 onClick={() => setIsDetailModalOpen(false)}
 className="px-8 py-3.5 bg-[#008080] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
 >
 Close Registry
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default FacultyDirectory;
