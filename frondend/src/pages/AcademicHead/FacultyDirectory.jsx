import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Users, User, Mail, Phone, Calendar,
    Clock, List, ChevronDown, ChevronUp, Search,
    Briefcase, GraduationCap, ArrowRight, ExternalLink,
    Filter, Activity, Edit2, Trash2, X, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const FacultyDirectory = () => {
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedFaculty, setExpandedFaculty] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchFaculties();
    }, [sortBy, dateRange]);

    const fetchFaculties = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/academic-head/faculties?sortBy=${sortBy}&startDate=${dateRange.start}&endDate=${dateRange.end}`);
            setFaculties(res.data.data);
        } catch (error) {
            toast.error("Failed to load faculty directory");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const content = `
            <html>
                <head>
                    <title>Faculty Workforce Report - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 12px; }
                        th { background: #f8fafc; font-weight: bold; text-transform: uppercase; }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e293b; padding-bottom: 20px; }
                        .stats { margin: 20px 0; font-size: 14px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>MISSION X - FACULTY DIRECTORY</h1>
                        <p>Range: ${dateRange.start} to ${dateRange.end}</p>
                    </div>
                    <div class="stats">TOTAL FACULTY: ${faculties.length}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Students</th>
                                <th>Total Hours</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${faculties.map(f => `
                                <tr>
                                    <td>${f.name}</td>
                                    <td>${f.email}</td>
                                    <td>${f.studentCount}</td>
                                    <td>${f.totalHours}h</td>
                                    <td>${new Date(f.created_at).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    };

    const handleEditFaculty = (faculty) => {
        setEditingFaculty({ ...faculty });
        setIsEditModalOpen(true);
    };

    const handleUpdateFaculty = async () => {
        try {
            const res = await api.put(`/academic-head/faculties/${editingFaculty.id}`, editingFaculty);
            if (res.data.success) {
                toast.success("Faculty record updated successfully");
                setIsEditModalOpen(false);
                fetchFaculties();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Update operation failed");
        }
    };

    const handleDeleteFaculty = async (id) => {
        if (!window.confirm("PERMANENT ACTION: Delete this faculty registry? This cannot be undone.")) return;
        try {
            const res = await api.delete(`/academic-head/faculties/${id}`);
            if (res.data.success) {
                toast.success("Faculty record purged from system");
                fetchFaculties();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete faculty");
        }
    };

    const filteredFaculties = faculties.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-40"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-6 group hover:rotate-0 transition-all duration-500">
                        <Users size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Faculty Directory</h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                            <Activity size={12} className="text-indigo-500" />
                            Comprehensive management of faculty profiles, assigned student cohorts, and live session timelines
                        </p>
                    </div>
                </div>

                <div className="relative z-10 w-full md:w-96">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Find by Name or Email..."
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:bg-white focus:ring-8 ring-indigo-500/5 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filter & Analysis Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-end lg:items-center justify-between px-2">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-white p-2 border border-slate-100 rounded-2xl shadow-sm">
                        <button 
                            onClick={() => setSortBy('newest')}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'newest' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                        >Newest First</button>
                        <button 
                            onClick={() => setSortBy('oldest')}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'oldest' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                        >Oldest First</button>
                        <button 
                            onClick={() => setSortBy('most_students')}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'most_students' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                        >Top Load</button>
                        <button 
                            onClick={() => setSortBy('most_hours')}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'most_hours' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                        >Most Hours</button>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 border border-slate-100 rounded-2xl shadow-sm">
                        <div className="flex flex-col gap-0.5 px-2">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Audit Start</span>
                            <input 
                                type="date" 
                                className="text-[10px] font-black text-slate-700 outline-none" 
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                        </div>
                        <div className="w-px h-6 bg-slate-100"></div>
                        <div className="flex flex-col gap-0.5 px-2">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Audit End</span>
                            <input 
                                type="date" 
                                className="text-[10px] font-black text-slate-700 outline-none" 
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 active:scale-95"
                >
                    <Activity size={16} /> Print Analytics Registry
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-32 space-y-4">
                    <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Faculty Database...</p>
                </div>
            ) : filteredFaculties.length === 0 ? (
                <div className="bg-white p-20 rounded-[4rem] text-center border-2 border-dashed border-slate-100">
                    <Users size={64} className="text-slate-100 mx-auto mb-6" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching faculty profiles found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {filteredFaculties.map((faculty) => (
                        <div key={faculty.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                                            <User size={30} className="text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">{faculty.name}</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                                                    {faculty.status}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 italic">
                                                    Joined: {new Date(faculty.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-3">
                                        <div className="flex gap-2">
                                            <div className="bg-indigo-50 px-4 py-3 rounded-2xl border border-indigo-100 text-center min-w-[100px]">
                                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Students</p>
                                                <p className="text-sm font-black text-indigo-700 italic">{faculty.studentCount}</p>
                                            </div>
                                            <div className="bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100 text-center min-w-[100px]">
                                                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Total Hours</p>
                                                <p className="text-sm font-black text-emerald-700 italic">{faculty.totalHours}h</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditFaculty(faculty)}
                                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                                                title="Edit Faculty"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFaculty(faculty.id)}
                                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                                                title="Delete Faculty"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <Mail size={14} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-600 truncate">{faculty.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <Phone size={14} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-600">{faculty.phone_number || "N/A"}</span>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setExpandedFaculty(expandedFaculty === faculty.id ? null : faculty.id)}
                                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all italic active:scale-95"
                                    >
                                        {expandedFaculty === faculty.id ? <><ChevronUp size={16} /> Close Schedule</> : <><Calendar size={16} /> View Today's Schedule</>}
                                    </button>
                                </div>
                            </div>

                            {/* Schedule / Students Expandable Area */}
                            {expandedFaculty === faculty.id && (
                                <div className="border-t border-slate-50 bg-slate-50/50 p-10 animate-in slide-in-from-top-4 duration-500">
                                    <div className="space-y-10">
                                        {/* Assigned Students */}
                                        <div className="space-y-4">
                                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                                                <GraduationCap size={14} className="text-indigo-500" /> Student Cohort
                                            </h4>
                                            <div className="flex flex-wrap gap-3">
                                                {faculty.assignedStudents.map(student => (
                                                    <div key={student.id} className="bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                                                        <div className="w-6 h-6 bg-indigo-50 rounded text-[9px] font-black text-indigo-600 flex items-center justify-center">
                                                            {student.grade}
                                                        </div>
                                                        <span className="text-xs font-black text-slate-700 uppercase italic">{student.name}</span>
                                                    </div>
                                                ))}
                                                {faculty.assignedStudents.length === 0 && (
                                                    <p className="text-[10px] font-bold text-slate-400 italic">No students assigned yet.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Today's Timeline */}
                                        <div className="space-y-4">
                                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                                                <Clock size={14} className="text-emerald-500" /> Daily Timeline
                                            </h4>
                                            {faculty.todaySchedule.length === 0 ? (
                                                <p className="text-[10px] font-bold text-slate-400 italic bg-white p-6 rounded-3xl border border-slate-100 text-center">
                                                    No sessions recorded for today.
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {faculty.todaySchedule.map((session, idx) => (
                                                        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group/item">
                                                            <div className="flex items-center gap-6">
                                                                <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black italic border border-emerald-100">
                                                                    {session.start_time} - {session.end_time}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-900 uppercase italic tracking-tight">{session.chapter}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 line-clamp-1">
                                                                        Attendees: {session.students_present || "N/A"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-3 py-1 rounded-lg uppercase italic border border-slate-100">
                                                                    {session.duration}
                                                                </span>
                                                                <button className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all">
                                                                    <ArrowRight size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Faculty Edit Modal */}
            {isEditModalOpen && editingFaculty && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border border-white/20">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 italic">
                                <Edit2 size={20} className="text-indigo-600" /> Edit Faculty Profile
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-slate-600 hover:shadow-md transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={editingFaculty.name}
                                    onChange={(e) => setEditingFaculty(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={editingFaculty.email}
                                    onChange={(e) => setEditingFaculty(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={editingFaculty.phone_number || ''}
                                        onChange={(e) => setEditingFaculty(prev => ({ ...prev, phone_number: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Place / City</label>
                                    <input
                                        type="text"
                                        value={editingFaculty.place || ''}
                                        onChange={(e) => setEditingFaculty(prev => ({ ...prev, place: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleUpdateFaculty}
                                className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Save size={16} /> Update Faculty
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyDirectory;
